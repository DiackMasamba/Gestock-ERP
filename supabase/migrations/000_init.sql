-- =============================================================================
-- Gestock Chat — Schéma initial (messagerie interne mono-entreprise)
-- =============================================================================

-- ----- Types -----------------------------------------------------------------
create type public.user_role as enum ('admin', 'employee');
create type public.conversation_type as enum ('direct', 'group');
create type public.attachment_type as enum ('image', 'file');

-- ----- Tables ----------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  role public.user_role not null default 'employee',
  expo_push_token text,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  type public.conversation_type not null,
  name text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index conversation_members_user_idx on public.conversation_members (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  content text,
  attachment_url text,
  attachment_type public.attachment_type,
  attachment_name text,
  created_at timestamptz not null default now(),
  constraint message_not_empty check (content is not null or attachment_url is not null)
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

-- ----- Création automatique du profil ----------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ----- Helper : appartenance à une conversation (évite la récursion RLS) ------
create or replace function public.is_conversation_member(conv_id uuid, uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.conversation_members
    where conversation_id = conv_id
      and user_id = uid
  );
$$;

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- profiles : annuaire lisible par tous les authentifiés ; MAJ de sa ligne uniquement
create policy "profiles_select_all"
  on public.profiles for select to authenticated using (true);

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- conversations : visibles uniquement par leurs membres
create policy "conversations_select_member"
  on public.conversations for select to authenticated
  using (public.is_conversation_member(id, auth.uid()));

create policy "conversations_insert_own"
  on public.conversations for insert to authenticated
  with check (created_by = auth.uid());

-- membres : visibles au sein de la même conversation ; chacun met à jour sa lecture
create policy "members_select_same_conv"
  on public.conversation_members for select to authenticated
  using (public.is_conversation_member(conversation_id, auth.uid()));

create policy "members_update_own"
  on public.conversation_members for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- messages : lus/écrits uniquement par les membres, envoi en son propre nom
create policy "messages_select_member"
  on public.messages for select to authenticated
  using (public.is_conversation_member(conversation_id, auth.uid()));

create policy "messages_insert_member"
  on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_conversation_member(conversation_id, auth.uid())
  );

-- =============================================================================
-- RPCs de création (SECURITY DEFINER : gèrent l'ajout des membres proprement)
-- =============================================================================
create or replace function public.create_direct_conversation(other_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  existing uuid;
  new_id uuid;
begin
  if me is null then raise exception 'Non authentifié'; end if;
  if other_user = me then raise exception 'Conversation impossible avec soi-même'; end if;

  -- Réutilise une conversation directe déjà existante entre les deux.
  select c.id into existing
  from public.conversations c
  join public.conversation_members m1 on m1.conversation_id = c.id and m1.user_id = me
  join public.conversation_members m2 on m2.conversation_id = c.id and m2.user_id = other_user
  where c.type = 'direct'
  limit 1;

  if existing is not null then
    return existing;
  end if;

  insert into public.conversations (type, created_by)
  values ('direct', me)
  returning id into new_id;

  insert into public.conversation_members (conversation_id, user_id)
  values (new_id, me), (new_id, other_user);

  return new_id;
end;
$$;

create or replace function public.create_group_conversation(group_name text, member_ids uuid[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  new_id uuid;
  uid uuid;
begin
  if me is null then raise exception 'Non authentifié'; end if;
  if coalesce(trim(group_name), '') = '' then raise exception 'Nom de groupe requis'; end if;

  insert into public.conversations (type, name, created_by)
  values ('group', group_name, me)
  returning id into new_id;

  insert into public.conversation_members (conversation_id, user_id) values (new_id, me);

  foreach uid in array member_ids loop
    if uid <> me then
      insert into public.conversation_members (conversation_id, user_id)
      values (new_id, uid)
      on conflict do nothing;
    end if;
  end loop;

  return new_id;
end;
$$;

grant execute on function public.create_direct_conversation(uuid) to authenticated;
grant execute on function public.create_group_conversation(text, uuid[]) to authenticated;

-- =============================================================================
-- Realtime : diffusion des nouveaux messages (soumise au RLS ci-dessus)
-- =============================================================================
alter publication supabase_realtime add table public.messages;
