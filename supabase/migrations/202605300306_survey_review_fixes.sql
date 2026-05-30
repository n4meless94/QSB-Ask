do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'survey_responses'
    ) then
      alter publication supabase_realtime drop table public.survey_responses;
    end if;

    if exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'survey_answers'
    ) then
      alter publication supabase_realtime drop table public.survey_answers;
    end if;
  end if;
end;
$$;

create or replace function public.replace_survey_draft(
  target_event_id uuid,
  target_survey_id uuid,
  next_title text,
  next_questions jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  question_item jsonb;
  inserted_question_id uuid;
  option_item record;
begin
  if not public.has_event_role(target_event_id, auth.uid(), array['organiser']::public.event_role[]) then
    raise exception 'Only organisers can replace survey drafts.';
  end if;

  if not exists (
    select 1
    from public.surveys
    where id = target_survey_id
      and event_id = target_event_id
  ) then
    raise exception 'Survey could not be found for this event.';
  end if;

  update public.surveys
  set title = btrim(next_title)
  where id = target_survey_id
    and event_id = target_event_id;

  delete from public.survey_questions
  where survey_id = target_survey_id;

  for question_item in
    select value
    from jsonb_array_elements(coalesce(next_questions, '[]'::jsonb))
  loop
    insert into public.survey_questions (
      survey_id,
      type,
      prompt,
      position,
      rating_scale
    )
    values (
      target_survey_id,
      (question_item->>'type')::public.survey_question_type,
      btrim(question_item->>'prompt'),
      (question_item->>'position')::integer,
      case
        when question_item->>'type' = 'rating' then (question_item->>'rating_scale')::integer
        else null
      end
    )
    returning id into inserted_question_id;

    if question_item->>'type' in ('multiple_choice', 'multiple_select') then
      for option_item in
        select value #>> '{}' as label, ordinality
        from jsonb_array_elements(question_item->'options') with ordinality as option_items(value, ordinality)
        order by ordinality
      loop
        insert into public.survey_options (
          survey_question_id,
          label,
          position
        )
        values (
          inserted_question_id,
          btrim(option_item.label),
          (option_item.ordinality - 1)::integer
        );
      end loop;
    end if;
  end loop;
end;
$$;

grant execute on function public.replace_survey_draft(uuid, uuid, text, jsonb) to authenticated;
