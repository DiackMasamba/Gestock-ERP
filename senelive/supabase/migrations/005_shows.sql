-- SeneLive — socle des lives (phase 2).
-- Supabase ne diffuse pas de vidéo : `room` référence la salle chez le
-- prestataire de streaming (LiveKit / Mux / Cloudflare Stream). Ici on ne gère
-- que ce qui est du ressort de la base : programmation, produit à l'écran,
-- chat temps réel.

create type public.show_status as enum ('scheduled', 'live', 'ended', 'cancelled');

create table public.shows (
  id            uuid primary key default gen_random_uuid(),
  shop_id       uuid not null references public.shops (id) on delete cascade,
  title         text not null,
  status        public.show_status not null default 'scheduled',
  room          text unique,
  thumbnail_url text,
  scheduled_at  timestamptz,
  started_at    timestamptz,
  ended_at      timestamptz,
  viewer_count  integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint shows_title_length check (char_length(title) between 3 and 120),
  constraint shows_viewer_count_positive check (viewer_count >= 0)
);

create index shows_live_idx on public.shows (started_at desc) where status = 'live';
create index shows_shop_idx on public.shows (shop_id, created_at desc);

create trigger shows_touch_updated_at
  before update on public.shows
  for each row execute function public.touch_updated_at();

-- Les articles présentés pendant le live. featured_at marque celui à l'écran.
create table public.show_listings (
  show_id     uuid not null references public.shows (id) on delete cascade,
  listing_id  uuid not null references public.listings (id) on delete cascade,
  position    smallint not null default 0,
  featured_at timestamptz,
  primary key (show_id, listing_id)
);

create index show_listings_featured_idx on public.show_listings (show_id, featured_at desc);

create table public.show_messages (
  id         uuid primary key default gen_random_uuid(),
  show_id    uuid not null references public.shows (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  author_name text,
  body       text not null,
  created_at timestamptz not null default now(),
  constraint show_messages_body_length check (char_length(body) between 1 and 500)
);

create index show_messages_show_idx on public.show_messages (show_id, created_at desc);

alter table public.shows         enable row level security;
alter table public.show_listings enable row level security;
alter table public.show_messages enable row level security;

create policy shows_select_all on public.shows
  for select to anon, authenticated
  using (
    status in ('live', 'scheduled', 'ended')
    or public.owns_shop(shop_id)
    or public.is_admin()
  );
create policy shows_write_own on public.shows
  for all to authenticated
  using (public.owns_shop(shop_id) or public.is_admin())
  with check (public.owns_shop(shop_id) or public.is_admin());

create policy show_listings_select_visible on public.show_listings
  for select to anon, authenticated
  using (exists (select 1 from public.shows s where s.id = show_id));
create policy show_listings_write_own on public.show_listings
  for all to authenticated
  using (
    exists (
      select 1 from public.shows s
      where s.id = show_id and (public.owns_shop(s.shop_id) or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.shows s
      where s.id = show_id and (public.owns_shop(s.shop_id) or public.is_admin())
    )
  );

-- Chat : lisible par tous les spectateurs, écrit sous sa propre identité et
-- seulement pendant le live.
create policy show_messages_select_visible on public.show_messages
  for select to anon, authenticated
  using (exists (select 1 from public.shows s where s.id = show_id));
create policy show_messages_insert_own on public.show_messages
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (select 1 from public.shows s where s.id = show_id and s.status = 'live')
  );
create policy show_messages_delete_moderation on public.show_messages
  for delete to authenticated
  using (
    author_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.shows s where s.id = show_id and public.owns_shop(s.shop_id)
    )
  );

alter publication supabase_realtime add table public.show_messages;
alter publication supabase_realtime add table public.shows;
