alter table public.knockout_matches add column if not exists date timestamptz;
notify pgrst, 'reload schema';
