
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.monthly_reading_count(uuid) FROM PUBLIC, anon, authenticated;
