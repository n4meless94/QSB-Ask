do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'questions'
    ) then
      alter publication supabase_realtime add table public.questions;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'question_votes'
    ) then
      alter publication supabase_realtime add table public.question_votes;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'moderation_actions'
    ) then
      alter publication supabase_realtime add table public.moderation_actions;
    end if;
  end if;
end;
$$;
