-- =============================================================================
-- Stockage des pièces jointes (bucket privé `attachments`)
-- Convention de chemin : "<conversation_id>/<timestamp>-<nom_fichier>"
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- Envoi autorisé uniquement dans une conversation dont on est membre.
create policy "attachments_insert_member"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and public.is_conversation_member(
      nullif(split_part(name, '/', 1), '')::uuid,
      auth.uid()
    )
  );

-- Lecture (URL signée) réservée aux membres de la conversation.
create policy "attachments_select_member"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'attachments'
    and public.is_conversation_member(
      nullif(split_part(name, '/', 1), '')::uuid,
      auth.uid()
    )
  );
