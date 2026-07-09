-- =============================================================================
-- Durcissement des droits d'exécution des fonctions (audit sécurité Supabase).
-- Retire l'exposition superflue au rôle `anon` et à la fonction trigger.
-- =============================================================================

-- Fonction trigger : ne doit jamais être appelable via l'API REST.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Helper interne (utilisé uniquement par les policies RLS) : réservé aux authentifiés.
revoke all on function public.is_conversation_member(uuid, uuid) from public, anon;
grant execute on function public.is_conversation_member(uuid, uuid) to authenticated;

-- RPCs de création : réservées aux utilisateurs connectés (jamais anon).
revoke all on function public.create_direct_conversation(uuid) from public, anon;
revoke all on function public.create_group_conversation(text, uuid[]) from public, anon;
grant execute on function public.create_direct_conversation(uuid) to authenticated;
grant execute on function public.create_group_conversation(text, uuid[]) to authenticated;
