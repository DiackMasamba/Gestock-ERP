-- SeneLive — correction : le sous-total d'une commande restait à 0.
--
-- Cause : order_items_recalc() met à jour orders.subtotal, mais le trigger
-- orders_guard_transitions() (qui s'exécute avant, ordre alphabétique) faisait
-- `new.subtotal := old.subtotal` pour empêcher un client d'imposer un montant.
-- Le garde-fou annulait donc le recalcul légitime.
--
-- Correction : ne plus *garder* subtotal mais le *dériver*. orders_sync_total()
-- le recalcule depuis order_items à chaque insert/update, quel que soit
-- l'auteur de la requête. Un client ne peut plus l'influencer du tout — c'est
-- une garantie plus forte que le garde-fou précédent, et elle survit à l'ajout
-- de lignes par le vendeur.

create or replace function private.orders_sync_total()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.subtotal := coalesce(
    (select sum(i.line_total) from public.order_items i where i.order_id = new.id),
    0
  );
  new.total := new.subtotal + new.delivery_fee;
  return new;
end;
$$;

revoke all on function private.orders_sync_total() from public, anon, authenticated;

-- subtotal disparaît des colonnes « restaurées » : il est désormais dérivé.
create or replace function private.orders_guard_transitions()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Pas d'utilisateur connecté = appel de confiance (migration, service_role,
  -- tâche serveur). Le rôle `anon` n'a de toute façon aucune policy UPDATE sur
  -- orders : la RLS l'arrête avant ce trigger.
  if auth.uid() is null or private.is_admin() then
    return new;
  end if;

  if old.buyer_id = auth.uid() then
    new.payment_status := old.payment_status;
    new.delivery_fee   := old.delivery_fee;
    new.shop_id        := old.shop_id;
    new.buyer_id       := old.buyer_id;
    new.order_number   := old.order_number;

    if new.status <> old.status then
      if not (old.status = 'pending' and new.status = 'cancelled') then
        raise exception 'Un acheteur ne peut qu''annuler une commande en attente (% -> %)',
          old.status, new.status;
      end if;
    end if;

    if old.status <> 'pending' then
      new.delivery_address := old.delivery_address;
      new.delivery_city_id := old.delivery_city_id;
      new.delivery_phone   := old.delivery_phone;
    end if;

    return new;
  end if;

  if private.owns_shop(old.shop_id) then
    new.shop_id          := old.shop_id;
    new.buyer_id         := old.buyer_id;
    new.order_number     := old.order_number;
    new.delivery_address := old.delivery_address;
    new.delivery_city_id := old.delivery_city_id;
    new.delivery_phone   := old.delivery_phone;
    new.buyer_note       := old.buyer_note;

    if old.status <> 'pending' then
      new.delivery_fee := old.delivery_fee;
    end if;

    if new.status <> old.status then
      if not (
        (old.status = 'pending'   and new.status in ('confirmed', 'cancelled'))
        or (old.status = 'confirmed' and new.status in ('shipped', 'cancelled'))
        or (old.status = 'shipped'   and new.status in ('delivered', 'cancelled'))
        or (old.status = 'delivered' and new.status = 'refunded')
      ) then
        raise exception 'Transition de statut interdite (% -> %)', old.status, new.status;
      end if;
    end if;

    return new;
  end if;

  raise exception 'Modification de commande non autorisée';
end;
$$;

revoke all on function private.orders_guard_transitions() from public, anon, authenticated;

-- Le recalcul n'a plus qu'à « toucher » la commande : orders_sync_total fait
-- le calcul, ce qui garantit une seule source de vérité.
create or replace function private.recalc_order_subtotal(p_order_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.orders o set updated_at = now() where o.id = p_order_id;
$$;

revoke all on function private.recalc_order_subtotal(uuid) from public, anon, authenticated;

-- Rattrapage des commandes déjà créées avec un sous-total faux.
update public.orders set updated_at = now();
