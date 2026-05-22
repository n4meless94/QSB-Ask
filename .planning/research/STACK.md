# Stack Research: QSB Ask

## Recommended Stack

- Next.js 16.x App Router with React and TypeScript.
- Tailwind CSS with a small internal component set.
- Managed Supabase for Auth, Postgres, Row Level Security, Realtime, and database APIs.
- Recharts 3.x for survey result charts.
- Coolify on QSB VPS for Next.js app deployment.
- CSV export generated server-side.

## Why This Stack Fits

Next.js gives the project one full-stack application surface for authenticated admin screens, public participant screens, route handlers, server actions, and server-side environment variables.

Supabase fits the data model because the product is relational: events, members, roles, questions, votes, surveys, responses, and moderation actions. Supabase Realtime directly supports the v1 requirement for live updates across moderator, audience, presenter, and presentation views.

Recharts is a pragmatic charting choice for survey results because it provides React chart components, responsive containers, bar charts, labels, legends, and tooltips.

Coolify matches the QSB VPS deployment SOP. The app must appear as a Coolify resource and use Coolify-managed domains, containers, and environment variables.

## Notes

- Supabase custom domains are paid-plan add-ons, so v1 should keep the default Supabase project URL in configuration.
- Users should only see `ask.qsbportal.com.my`.
- Backend can move fully onto QSB VPS later only if data governance requires it.

