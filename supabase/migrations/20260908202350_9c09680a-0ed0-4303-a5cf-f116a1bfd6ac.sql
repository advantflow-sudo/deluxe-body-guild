-- Remove client read/write access to the raw OAuth token columns on connected_devices.
REVOKE SELECT, INSERT, UPDATE ON public.connected_devices FROM authenticated;
REVOKE SELECT, INSERT, UPDATE ON public.connected_devices FROM anon;

GRANT SELECT (
  id, user_id, provider, display_name, status, last_synced_at,
  external_user_id, scopes, created_at, updated_at
) ON public.connected_devices TO authenticated;

GRANT INSERT (
  id, user_id, provider, display_name, status, last_synced_at,
  external_user_id, scopes, created_at, updated_at
) ON public.connected_devices TO authenticated;

GRANT UPDATE (
  display_name, status, last_synced_at, external_user_id, scopes, updated_at
) ON public.connected_devices TO authenticated;

GRANT ALL ON public.connected_devices TO service_role;