create or replace function public.upvote_question(
  target_event_id uuid,
  target_question_id uuid,
  target_participant_session_id uuid
)
returns table (
  already_voted boolean,
  question public.questions
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_question public.questions%rowtype;
  updated_question public.questions%rowtype;
begin
  select *
  into current_question
  from public.questions
  where id = target_question_id
    and event_id = target_event_id
    and status = 'live'
  for update;

  if not found then
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

  insert into public.question_votes (question_id, participant_session_id)
  values (target_question_id, target_participant_session_id)
  on conflict on constraint question_votes_one_per_session do nothing;

  if not found then
    already_voted := true;
    question := current_question;
    return next;
    return;
  end if;

  update public.questions
  set vote_count = (
    select count(*)::integer
    from public.question_votes
    where question_id = target_question_id
  )
  where id = target_question_id
  returning * into updated_question;

  already_voted := false;
  question := updated_question;
  return next;
end;
$$;

revoke execute on function public.upvote_question(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.upvote_question(uuid, uuid, uuid) to service_role;
