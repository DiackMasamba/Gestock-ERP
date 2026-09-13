-- SeneLive — socle : géographie, profils, boutiques, catalogue.
-- Montants en FCFA (XOF) : devise sans sous-unité => entiers, jamais de numeric/float.
-- Ordre des déclarations : PostgreSQL valide le corps des fonctions `language sql`
-- à la création, donc chaque helper est déclaré après les tables qu'il lit.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- types

create type public.user_role as enum ('buyer', 'seller', 'admin');
create type public.verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
create type public.listing_status as enum ('draft', 'active', 'sold', 'archived');
create type public.listing_condition as enum ('new', 'like_new', 'good', 'fair');

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- géographie

create table public.regions (
  id    smallint generated always as identity primary key,
  name  text not null unique,
  slug  text not null unique
);

create table public.cities (
  id         integer generated always as identity primary key,
  region_id  smallint not null references public.regions (id) on delete restrict,
  name       text not null,
  slug       text not null unique,
  constraint cities_name_per_region unique (region_id, name)
);

create index cities_region_idx on public.cities (region_id);

-- ---------------------------------------------------------------- profils

create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  full_name         text,
  username          text unique,
  avatar_url        text,
  phone             text,
  phone_verified_at timestamptz,
  role              public.user_role not null default 'buyer',
  city_id           integer references public.cities (id) on delete set null,
  neighborhood      text,
  bio               text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint profiles_phone_e164 check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$'),
  constraint profiles_username_format check (username is null or username ~ '^[a-z0-9_]{3,30}$')
);

create index profiles_city_idx on public.profiles (city_id);

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Lu depuis les policies : security definer pour éviter la récursion RLS
-- (une policy sur profiles qui lit profiles boucle sinon).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Crée le profil à l'inscription. Le rôle vient des métadonnées MAIS 'admin'
-- n'est jamais accordé ainsi : raw_user_meta_data est contrôlé par le client.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text;
  v_role  public.user_role;
begin
  v_phone := nullif(new.phone, '');
  if v_phone is not null and left(v_phone, 1) <> '+' then
    v_phone := '+' || v_phone;
  end if;

  v_role := case
    when new.raw_user_meta_data ->> 'role' = 'seller' then 'seller'::public.user_role
    else 'buyer'::public.user_role
  end;

  insert into public.profiles (id, full_name, avatar_url, phone, phone_verified_at, role)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', '')
    ),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    v_phone,
    new.phone_confirmed_at,
    v_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- boutiques

create table public.shops (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles (id) on delete cascade,
  name          text not null,
  slug          text not null unique,
  description   text,
  logo_url      text,
  banner_url    text,
  city_id       integer references public.cities (id) on delete set null,
  neighborhood  text,
  whatsapp      text,
  verification  public.verification_status not null default 'unverified',
  verified_at   timestamptz,
  is_active     boolean not null default true,
  rating_avg    numeric(3, 2) not null default 0,
  rating_count  integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint shops_owner_unique unique (owner_id),
  constraint shops_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint shops_name_length check (char_length(name) between 2 and 60),
  constraint shops_whatsapp_e164 check (whatsapp is null or whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  constraint shops_rating_range check (rating_avg >= 0 and rating_avg <= 5),
  constraint shops_rating_count_positive check (rating_count >= 0)
);

create index shops_city_idx on public.shops (city_id) where is_active;
create index shops_verification_idx on public.shops (verification) where is_active;

create trigger shops_touch_updated_at
  before update on public.shops
  for each row execute function public.touch_updated_at();

create or replace function public.owns_shop(p_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.shops s
    where s.id = p_shop_id and s.owner_id = auth.uid()
  );
$$;

create or replace function public.my_shop_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.id from public.shops s where s.owner_id = auth.uid() limit 1;
$$;

-- La RLS ne filtre pas par colonne : ce garde-fou empêche un vendeur de
-- s'auto-vérifier ou de se fabriquer une note.
create or replace function public.shops_guard_privileged_columns()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  new.verification := old.verification;
  new.verified_at  := old.verified_at;
  new.rating_avg   := old.rating_avg;
  new.rating_count := old.rating_count;
  return new;
end;
$$;

create trigger shops_guard_privileged_columns
  before update on public.shops
  for each row execute function public.shops_guard_privileged_columns();

-- ---------------------------------------------------------------- catalogue

create table public.categories (
  id        smallint generated always as identity primary key,
  parent_id smallint references public.categories (id) on delete cascade,
  name      text not null,
  slug      text not null unique,
  position  smallint not null default 0
);

create table public.listings (
  id               uuid primary key default gen_random_uuid(),
  shop_id          uuid not null references public.shops (id) on delete cascade,
  category_id      smallint references public.categories (id) on delete set null,
  title            text not null,
  description      text,
  price            integer not null,
  compare_at_price integer,
  quantity         integer not null default 1,
  condition        public.listing_condition not null default 'new',
  status           public.listing_status not null default 'draft',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint listings_title_length check (char_length(title) between 3 and 140),
  constraint listings_price_positive check (price >= 0),
  constraint listings_quantity_positive check (quantity >= 0),
  constraint listings_compare_at_price_higher
    check (compare_at_price is null or compare_at_price > price)
);

create index listings_shop_idx on public.listings (shop_id);
create index listings_feed_idx on public.listings (created_at desc) where status = 'active';
create index listings_category_idx on public.listings (category_id) where status = 'active';

create trigger listings_touch_updated_at
  before update on public.listings
  for each row execute function public.touch_updated_at();

create table public.listing_images (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  path       text not null,
  position   smallint not null default 0,
  created_at timestamptz not null default now(),
  constraint listing_images_position_unique unique (listing_id, position)
);

create index listing_images_listing_idx on public.listing_images (listing_id);

-- ---------------------------------------------------------------- RLS

alter table public.regions        enable row level security;
alter table public.cities         enable row level security;
alter table public.categories     enable row level security;
alter table public.profiles       enable row level security;
alter table public.shops          enable row level security;
alter table public.listings       enable row level security;
alter table public.listing_images enable row level security;

-- Référentiels : lecture publique, écriture admin.
create policy regions_select_all on public.regions
  for select to anon, authenticated using (true);
create policy regions_write_admin on public.regions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy cities_select_all on public.cities
  for select to anon, authenticated using (true);
create policy cities_write_admin on public.cities
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy categories_select_all on public.categories
  for select to anon, authenticated using (true);
create policy categories_write_admin on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- profiles contient le téléphone : jamais de lecture publique.
-- L'identité publique d'un vendeur passe par shops, celle d'un avis par
-- reviews.author_name (snapshot).
create policy profiles_select_own on public.profiles
  for select to authenticated using (auth.uid() = id or public.is_admin());
create policy profiles_update_own on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_admin_all on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Boutiques : visibles dès qu'actives (le badge « vérifié » est un signal,
-- pas une condition d'affichage) ; sinon propriétaire ou admin.
create policy shops_select_active on public.shops
  for select to anon, authenticated
  using (is_active or owner_id = auth.uid() or public.is_admin());
create policy shops_insert_own on public.shops
  for insert to authenticated with check (owner_id = auth.uid());
create policy shops_update_own on public.shops
  for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());
create policy shops_delete_own on public.shops
  for delete to authenticated using (owner_id = auth.uid() or public.is_admin());

-- Annonces : les actives d'une boutique active, sinon le vendeur ou l'admin.
create policy listings_select_active on public.listings
  for select to anon, authenticated
  using (
    (
      status = 'active'
      and exists (select 1 from public.shops s where s.id = shop_id and s.is_active)
    )
    or public.owns_shop(shop_id)
    or public.is_admin()
  );
create policy listings_write_own on public.listings
  for all to authenticated
  using (public.owns_shop(shop_id) or public.is_admin())
  with check (public.owns_shop(shop_id) or public.is_admin());

create policy listing_images_select_visible on public.listing_images
  for select to anon, authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id));
create policy listing_images_write_own on public.listing_images
  for all to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and (public.owns_shop(l.shop_id) or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and (public.owns_shop(l.shop_id) or public.is_admin())
    )
  );
