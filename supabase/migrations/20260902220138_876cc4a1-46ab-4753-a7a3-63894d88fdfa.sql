revoke all on function public.has_role(uuid, public.app_role) from anon, public;
revoke all on function public.is_admin() from anon, public;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;