-- SeneLive — stockage des médias.
-- Photos produits et logos sont publics par nature (un catalogue se partage) :
-- buckets publics en lecture, écriture cloisonnée par dossier.
--   avatars/{user_id}/…
--   shop-media/{shop_id}/…
--   listing-images/{shop_id}/{listing_id}/…

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',        'avatars',        true, 2097152,
   array['image/jpeg', 'image/png', 'image/webp']),
  ('shop-media',     'shop-media',     true, 5242880,
   array['image/jpeg', 'image/png', 'image/webp']),
  ('listing-images', 'listing-images', true, 5242880,
   array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Un cast direct en uuid dans une policy fait échouer la requête si le dossier
-- n'est pas un uuid : on convertit sans lever d'erreur.
create or replace function public.safe_uuid(p_value text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return p_value::uuid;
exception
  when others then return null;
end;
$$;

create policy avatars_read_all on storage.objects
  for select to anon, authenticated using (bucket_id = 'avatars');
create policy avatars_write_own on storage.objects
  for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy shop_media_read_all on storage.objects
  for select to anon, authenticated using (bucket_id = 'shop-media');
create policy shop_media_write_owner on storage.objects
  for all to authenticated
  using (
    bucket_id = 'shop-media'
    and public.owns_shop(public.safe_uuid((storage.foldername(name))[1]))
  )
  with check (
    bucket_id = 'shop-media'
    and public.owns_shop(public.safe_uuid((storage.foldername(name))[1]))
  );

create policy listing_images_read_all on storage.objects
  for select to anon, authenticated using (bucket_id = 'listing-images');
create policy listing_images_write_owner on storage.objects
  for all to authenticated
  using (
    bucket_id = 'listing-images'
    and public.owns_shop(public.safe_uuid((storage.foldername(name))[1]))
  )
  with check (
    bucket_id = 'listing-images'
    and public.owns_shop(public.safe_uuid((storage.foldername(name))[1]))
  );
