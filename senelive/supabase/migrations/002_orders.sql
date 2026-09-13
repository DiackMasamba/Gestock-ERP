-- SeneLive — commandes, avis, abonnements.
-- Un avis n'est possible qu'après une commande livrée : c'est ce qui rend la
-- note d'un vendeur crédible (l'inverse des captures WhatsApp anonymes).

create type public.order_status as enum
  ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded');

create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');

create type public.payment_method as enum
  ('wave', 'orange_money', 'free_money', 'cash_on_delivery', 'card');

-- ---------------------------------------------------------------- commandes

create sequence public.order_number_seq;

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique,
  buyer_id         uuid not null references public.profiles (id) on delete restrict,
  shop_id          uuid not null references public.shops (id) on delete restrict,
  status           public.order_status not null default 'pending',
  payment_method   public.payment_method not null default 'cash_on_delivery',
  payment_status   public.payment_status not null default 'pending',
  subtotal         integer not null default 0,
  delivery_fee     integer not null default 0,
  total            integer not null default 0,
  delivery_city_id integer references public.cities (id) on delete set null,
  delivery_address text,
  delivery_phone   text,
  buyer_note       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint orders_amounts_positive
    check (subtotal >= 0 and delivery_fee >= 0 and total >= 0),
  constraint orders_delivery_phone_e164
    check (delivery_phone is null or delivery_phone ~ '^\+[1-9][0-9]{7,14}$')
);

create index orders_buyer_idx on public.orders (buyer_id, created_at desc);
create index orders_shop_idx on public.orders (shop_id, created_at desc);
create index orders_status_idx on public.orders (status);

create table public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete set null,
  title      text not null,
  unit_price integer not null,
  quantity   integer not null,
  line_total integer generated always as (unit_price * quantity) stored,
  constraint order_items_unit_price_positive check (unit_price >= 0),
  constraint order_items_quantity_positive check (quantity > 0)
);

create index order_items_order_idx on public.order_items (order_id);

-- total = subtotal + livraison, recalculé côté base pour qu'aucun client ne
-- puisse envoyer un montant de son choix.
create or replace function public.orders_sync_total()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.total := new.subtotal + new.delivery_fee;
  return new;
end;
$$;

create trigger orders_sync_total
  before insert or update on public.orders
  for each row execute function public.orders_sync_total();

create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

create or replace function public.recalc_order_subtotal(p_order_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.orders o
     set subtotal = coalesce(
           (select sum(i.line_total) from public.order_items i where i.order_id = o.id),
           0
         )
   where o.id = p_order_id;
$$;

create or replace function public.order_items_recalc()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.recalc_order_subtotal(coalesce(new.order_id, old.order_id));
  return coalesce(new, old);
end;
$$;

create trigger order_items_recalc
  after insert or update or delete on public.order_items
  for each row execute function public.order_items_recalc();

-- ---------------------------------------------------------------- transitions

-- La RLS autorise l'UPDATE ; ce trigger décide de ce que chacun peut changer.
create or replace function public.orders_guard_transitions()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  -- Acheteur : peut annuler tant que la commande n'est pas confirmée, et
  -- corriger ses infos de livraison. Rien d'autre.
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

  -- Vendeur : suit l'avancement, jamais les montants ni l'adresse.
  if public.owns_shop(old.shop_id) then
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

create trigger orders_guard_transitions
  before update on public.orders
  for each row execute function public.orders_guard_transitions();

-- ---------------------------------------------------------------- livraison

-- Barème volontairement simple et centralisé : à remplacer par les vrais
-- tarifs coursier quand ils seront connus.
create or replace function public.delivery_fee_for(p_shop_city integer, p_dest_city integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when p_shop_city is null or p_dest_city is null then 2500
    when p_shop_city = p_dest_city then 1000
    else 2500
  end;
$$;

-- ---------------------------------------------------------------- passer commande

-- Une seule opération atomique : vérifie la dispo, crée la commande et sa
-- ligne, décrémente le stock. Le client n'envoie jamais de prix ni de total.
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

  -- Verrou sur l'annonce : deux acheteurs simultanés ne peuvent pas prendre
  -- la même dernière pièce.
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

  v_fee := public.delivery_fee_for(v_shop.city_id, p_delivery_city_id);

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

revoke all on function public.place_order(uuid, integer, public.payment_method, integer, text, text, text) from public, anon;
grant execute on function public.place_order(uuid, integer, public.payment_method, integer, text, text, text) to authenticated;

-- ---------------------------------------------------------------- avis

create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null unique references public.orders (id) on delete cascade,
  shop_id     uuid not null references public.shops (id) on delete cascade,
  buyer_id    uuid not null references public.profiles (id) on delete cascade,
  author_name text,
  rating      smallint not null,
  comment     text,
  created_at  timestamptz not null default now(),
  constraint reviews_rating_range check (rating between 1 and 5),
  constraint reviews_comment_length check (comment is null or char_length(comment) <= 1000)
);

create index reviews_shop_idx on public.reviews (shop_id, created_at desc);

create or replace function public.refresh_shop_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shop uuid := coalesce(new.shop_id, old.shop_id);
begin
  update public.shops s
     set rating_avg = coalesce(
           (select round(avg(r.rating)::numeric, 2) from public.reviews r where r.shop_id = v_shop),
           0
         ),
         rating_count = (select count(*) from public.reviews r where r.shop_id = v_shop)
   where s.id = v_shop;
  return coalesce(new, old);
end;
$$;

create trigger reviews_refresh_shop_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_shop_rating();

-- ---------------------------------------------------------------- abonnements

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  shop_id     uuid not null references public.shops (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, shop_id)
);

create index follows_shop_idx on public.follows (shop_id);

-- ---------------------------------------------------------------- RLS

alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews     enable row level security;
alter table public.follows     enable row level security;

-- Une commande ne concerne que son acheteur et sa boutique.
create policy orders_select_involved on public.orders
  for select to authenticated
  using (buyer_id = auth.uid() or public.owns_shop(shop_id) or public.is_admin());
-- Pas d'INSERT direct : tout passe par place_order() (prix et stock côté base).
create policy orders_update_involved on public.orders
  for update to authenticated
  using (buyer_id = auth.uid() or public.owns_shop(shop_id) or public.is_admin())
  with check (buyer_id = auth.uid() or public.owns_shop(shop_id) or public.is_admin());

create policy order_items_select_involved on public.order_items
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

-- Avis : lecture publique (c'est le signal de confiance), écriture réservée à
-- l'acheteur d'une commande livrée de cette boutique.
create policy reviews_select_all on public.reviews
  for select to anon, authenticated using (true);
create policy reviews_insert_buyer on public.reviews
  for insert to authenticated
  with check (
    buyer_id = auth.uid()
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.buyer_id = auth.uid()
        and o.shop_id = shop_id
        and o.status = 'delivered'
    )
  );
create policy reviews_update_own on public.reviews
  for update to authenticated
  using (buyer_id = auth.uid()) with check (buyer_id = auth.uid());
create policy reviews_delete_own on public.reviews
  for delete to authenticated using (buyer_id = auth.uid() or public.is_admin());

create policy follows_select_own on public.follows
  for select to authenticated using (follower_id = auth.uid() or public.owns_shop(shop_id));
create policy follows_write_own on public.follows
  for all to authenticated
  using (follower_id = auth.uid()) with check (follower_id = auth.uid());
