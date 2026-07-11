-- Existing deployments need zones added to Realtime after the base schema is already present.
do $$
begin
  alter publication supabase_realtime add table public.zones;
exception
  when duplicate_object then null;
end $$;
