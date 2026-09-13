-- SeneLive — durcissement : sortir les fonctions internes de l'API publique.
--
-- PostgREST expose le schéma `public` : toute fonction qui s'y trouve est
-- appelable sur /rest/v1/rpc/<nom>. Nos helpers sont `security definer` et
-- n'ont rien à faire là — notamment recalc_order_subtotal(), qui écrit sur
-- n'importe quelle commande en contournant la RLS.
--
-- Les policies et les triggers référencent les fonctions par OID : le
-- déplacement de schéma ne les casse pas. En revanche les corps qui appellent
-- `public.<helper>` par son nom doivent être réécrits.
--
-- place_order() reste dans `public` : c'est volontairement le seul point
-- d'entrée RPC de l'application.

create schema if not exists private;
grant usage on schema private to anon, authenticated;

alter function public.is_admin()                        set schema private;
alter function public.owns_shop(uuid)                   set schema private;
alter function public.my_shop_id()                      set schema private;
alter function public.safe_uuid(text)                   set schema private;
alter function public.delivery_fee_for(integer, integer) set schema private;
alter function public.recalc_order_subtotal(uuid)       set schema private;
alter function public.touch_updated_at()                set schema private;
alter function public.handle_new_user()                 set schema private;
alter function public.orders_sync_total()               set schema private;
alter function public.order_items_recalc()              set schema private;
alter function public.orders_guard_transitions()        set schema private;
alter function public.shops_guard_privileged_columns()  set schema private;
alter function public.refresh_shop_rating()             set schema private;

-- Corps réécrits : ces trois-là appelaient les helpers par leur ancien nom.
create or replace function private.shops_guard_privileged_columns()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if private.is_admin() then
    return new;
  end if;

  new.verification := old.verification;
  new.verified_at  := old.verified_at;
  new.rating_avg   := old.rating_avg;
  new.rating_count := old.rating_count;
  return new;
end;
$$;

create or replace function private.order_items_recalc()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.recalc_order_subtotal(coalesce(new.order_id, old.order_id));
  return coalesce(new, old);
end;
$$;

create or replace function private.orders_guard_transitions()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if private.is_admin() then
    return new;
  end if;

  if old.buyer_id = auth.uid() then
    new.payment_status := old.payment_status;
    new.subtotal       := old.subtotal;
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
    new.subtotal         := old.subtotal;
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

create or replace function public.place_order(
  p_listing_id       uuid,
  p_quantity         integer,
  p_payment_method   public.payment_method,
  p_delivery_city_id integer,
  p_delivery_address text,
  p_delivery_phone   text,
  p_buyer_note       text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_buyer    uuid := auth.uid();
  v_listing  public.listings;
  v_shop     public.shops;
  v_order_id uuid;
  v_fee      integer;
begin
  if v_buyer is null then
    raise exception 'Connexion requise pour commander';
  end if;

  if p_quantity is null or p_quantity < 1 then
    raise exception 'Quantité invalide';
  end if;

  select * into v_listing from public.listings where id = p_listing_id for update;
  if not found then
    raise exception 'Annonce introuvable';
  end if;
  if v_listing.status <> 'active' then
    raise exception 'Cette annonce n''est plus disponible';
  end if;
  if v_listing.quantity < p_quantity then
    raise exception 'Stock insuffisant : % disponible(s)', v_listing.quantity;
  end if;

  select * into v_shop from public.shops where id = v_listing.shop_id;
  if not v_shop.is_active then
    raise exception 'Cette boutique est fermée';
  end if;
  if v_shop.owner_id = v_buyer then
    raise exception 'Un vendeur ne peut pas commander son propre article';
  end if;

  if p_delivery_address is null or btrim(p_delivery_address) = '' then
    raise exception 'Adresse de livraison requise';
  end if;

  v_fee := private.delivery_fee_for(v_shop.city_id, p_delivery_city_id);

  insert into public.orders (
    order_number, buyer_id, shop_id, payment_method,
    delivery_fee, delivery_city_id, delivery_address, delivery_phone, buyer_note
  )
  values (
    'SL-' || to_char(now(), 'YY') || '-' ||
      lpad(nextval('public.order_number_seq')::text, 6, '0'),
    v_buyer, v_shop.id, p_payment_method,
    v_fee, p_delivery_city_id, btrim(p_delivery_address), p_delivery_phone, p_buyer_note
  )
  returning id into v_order_id;

  insert into public.order_items (order_id, listing_id, title, unit_price, quantity)
  values (v_order_id, v_listing.id, v_listing.title, v_listing.price, p_quantity);

  update public.listings
     set quantity = quantity - p_quantity,
         status = case when quantity - p_quantity = 0 then 'sold'::public.listing_status else status end
   where id = v_listing.id;

  return v_order_id;
end;
$$;

-- Défense en profondeur : les fonctions de trigger n'ont pas à être appelables.
-- (PostgreSQL vérifie EXECUTE à la création du trigger, pas à son exécution.)
revoke all on function private.touch_updated_at()               from public, anon, authenticated;
revoke all on function private.handle_new_user()                from public, anon, authenticated;
revoke all on function private.orders_sync_total()              from public, anon, authenticated;
revoke all on function private.order_items_recalc()             from public, anon, authenticated;
revoke all on function private.orders_guard_transitions()       from public, anon, authenticated;
revoke all on function private.shops_guard_privileged_columns() from public, anon, authenticated;
revoke all on function private.refresh_shop_rating()            from public, anon, authenticated;
revoke all on function private.recalc_order_subtotal(uuid)      from public, anon, authenticated;

-- is_admin / owns_shop / my_shop_id restent exécutables : les policies RLS les
-- évaluent avec les droits de l'appelant. Hors du schéma exposé, elles ne sont
-- plus joignables en RPC.
grant execute on function private.is_admin()      to anon, authenticated;
grant execute on function private.owns_shop(uuid) to anon, authenticated;
grant execute on function private.my_shop_id()    to authenticated;
grant execute on function private.safe_uuid(text) to anon, authenticated;
