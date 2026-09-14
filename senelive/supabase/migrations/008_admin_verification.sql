-- SeneLive — faille d'élévation de privilèges + circuit de vérification.
--
-- FAILLE : la policy profiles_update_own ne contraint que la ligne modifiée,
-- jamais les colonnes. N'importe quel compte pouvait donc exécuter
--   update public.profiles set role = 'admin' where id = auth.uid();
-- et devenir administrateur. Le même oubli avait déjà été corrigé sur shops
-- par un trigger ; profiles n'en avait pas.
--
-- La RLS PostgreSQL ne sait pas filtrer par colonne : le seul moyen est un
-- trigger BEFORE UPDATE qui restaure les colonnes privilégiées.

alter table public.shops
  add column if not exists verification_requested_at timestamptz;

create index if not exists shops_verification_queue_idx
  on public.shops (verification_requested_at)
  where verification = 'pending';

-- ---------------------------------------------------------------- profiles

create or replace function private.profiles_guard_privileged_columns()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Pas d'utilisateur connecté = appel de confiance (migration, service_role).
  if auth.uid() is null or private.is_admin() then
    return new;
  end if;

  -- Se déclarer vendeur n'accorde aucun privilège : ce qui compte est la
  -- possession d'une boutique. Tout autre changement de rôle — 'admin' au
  -- premier chef — est réservé à un administrateur.
  if not (old.role = 'buyer' and new.role = 'seller') then
    new.role := old.role;
  end if;

  -- Personne ne déclare son propre numéro vérifié ; et changer de numéro
  -- invalide la vérification précédente.
  if new.phone is distinct from old.phone then
    new.phone_verified_at := null;
  else
    new.phone_verified_at := old.phone_verified_at;
  end if;

  return new;
end;
$$;

revoke all on function private.profiles_guard_privileged_columns() from public, anon, authenticated;

drop trigger if exists profiles_guard_privileged_columns on public.profiles;
create trigger profiles_guard_privileged_columns
  before update on public.profiles
  for each row execute function private.profiles_guard_privileged_columns();

-- ---------------------------------------------------------------- shops

-- Le propriétaire peut désormais *demander* la vérification (et seulement
-- cela) ; l'administrateur seul l'accorde. verified_at suit automatiquement
-- le statut pour qu'il ne puisse pas diverger.
create or replace function private.shops_guard_privileged_columns()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if private.is_admin() then
    if new.verification = 'verified' and old.verification <> 'verified' then
      new.verified_at := now();
    elsif new.verification <> 'verified' then
      new.verified_at := null;
    end if;
    return new;
  end if;

  new.verified_at              := old.verified_at;
  new.rating_avg               := old.rating_avg;
  new.rating_count             := old.rating_count;
  new.owner_id                 := old.owner_id;
  new.verification_requested_at := old.verification_requested_at;

  if old.owner_id = auth.uid()
     and old.verification in ('unverified', 'rejected')
     and new.verification = 'pending' then
    new.verification_requested_at := now();
  else
    new.verification := old.verification;
  end if;

  return new;
end;
$$;

revoke all on function private.shops_guard_privileged_columns() from public, anon, authenticated;
