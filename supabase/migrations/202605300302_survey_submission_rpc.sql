create or replace function public.submit_survey_response(
  target_survey_id uuid,
  target_participant_session_id uuid,
  target_answers jsonb
)
returns table (
  already_submitted boolean,
  response_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  answer jsonb;
  inserted_response public.survey_responses%rowtype;
  existing_response_id uuid;
  target_event_id uuid;
begin
  if jsonb_typeof(target_answers) is distinct from 'array' then
    raise exception 'Survey answers must be an array.';
  end if;

  select event_id
  into target_event_id
  from public.surveys
  where id = target_survey_id
    and status = 'published';

  if target_event_id is null then
    return;
  end if;

  if not exists (
    select 1
    from public.participant_sessions
    where id = target_participant_session_id
      and event_id = target_event_id
  ) then
    return;
  end if;

  insert into public.survey_responses (survey_id, participant_session_id)
  values (target_survey_id, target_participant_session_id)
  on conflict on constraint survey_responses_one_per_session do nothing
  returning * into inserted_response;

  if not found then
    select id
    into existing_response_id
    from public.survey_responses
    where survey_id = target_survey_id
      and participant_session_id = target_participant_session_id;

    already_submitted := true;
    response_id := existing_response_id;
    return next;
    return;
  end if;

  for answer in select * from jsonb_array_elements(target_answers) loop
    if not exists (
      select 1
      from public.survey_questions
      where id = (answer ->> 'survey_question_id')::uuid
        and survey_id = target_survey_id
    ) then
      raise exception 'Survey answer references an invalid question.';
    end if;

    insert into public.survey_answers (
      survey_response_id,
      survey_question_id,
      selected_option_ids,
      rating_value,
      text_value
    )
    values (
      inserted_response.id,
      (answer ->> 'survey_question_id')::uuid,
      case
        when answer ? 'selected_option_ids' then array(
          select jsonb_array_elements_text(answer -> 'selected_option_ids')::uuid
        )
        else null
      end,
      nullif(answer ->> 'rating_value', '')::integer,
      nullif(answer ->> 'text_value', '')
    );
  end loop;

  already_submitted := false;
  response_id := inserted_response.id;
  return next;
end;
$$;

revoke execute on function public.submit_survey_response(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.submit_survey_response(uuid, uuid, jsonb) to service_role;
