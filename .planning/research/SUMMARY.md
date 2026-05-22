# Research Summary: QSB Ask

## Stack

Use Next.js, TypeScript, Tailwind CSS, managed Supabase, Recharts, and Coolify on QSB VPS.

## Table Stakes

- Email/password login and password reset.
- Event creation and join links.
- Event roles for organiser, moderator, and speaker.
- Participant sessions without account signup.
- Moderated Q&A with Pending, Live, Answered, Archived states.
- Upvotes and live sorting.
- Presenter View for approved questions.
- Survey builder and participant survey response flow.
- Survey results dashboard and presentation view.
- CSV exports.
- Live updates within 2 seconds.

## Watch Out For

- Never expose pending/dismissed/archived questions to audience or speaker views.
- Do not rely on client-side checks for access or moderation visibility.
- Keep deployment Coolify-managed.
- Keep Supabase as managed backend for v1 but isolate it behind configuration.
- Defer Slido parity features that are outside PRD/SPEC/SRS.

## Recommendation

Proceed with a vertical MVP roadmap: foundation and auth, core event/Q&A moderation, survey/results/export, then hardening and deployment.
