do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'surveys'
    ) then
      alter publication supabase_realtime add table public.surveys;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'survey_responses'
    ) then
      alter publication supabase_realtime add table public.survey_responses;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'survey_answers'
    ) then
      alter publication supabase_realtime add table public.survey_answers;
    end if;
  end if;
end;
$$;
