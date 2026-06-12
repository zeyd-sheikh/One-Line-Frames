# One Line Frames

One Line Frames is a quiet, student-focused platform for sharing one photo and
one short line. It is designed around curated moments rather than likes,
followers, comments, or algorithmic competition.

The project is currently in its **foundation phase**. Public pages and product
boundaries are present, while authentication, uploads, persistence, moderation,
and protected routes are intentionally not active yet.

## Stack

- Next.js App Router
- React
- Supabase Auth, Postgres, and Storage
- CSS maintained in `src/app/globals.css`

## Local setup

1. Install dependencies with `npm install`.
2. Create `.env.local`.
3. Add the following values from the Supabase project settings:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

4. Start the development server with `npm run dev`.

Never expose a Supabase secret or service-role key in a `NEXT_PUBLIC_*`
environment variable.

## Database foundation

The Phase 1A schema is stored in:

```text
supabase/migrations/20260612000000_initial_schema.sql
```

It creates profiles, categories, frames, submissions, tags, admin edit history,
appeals, removal requests, the public gallery function, and Row Level Security
policies. The local Supabase configuration also defines private original and
display image buckets with a 25 MB limit.

To validate or rebuild the database locally, install Docker Desktop and run:

```bash
supabase start
supabase db reset
```

Applying the migration to the hosted project should be a deliberate database
step. Do not paste both the original draft SQL and this migration into the same
project without reviewing the existing schema first.

## Commands

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Current structure

```text
src/
  app/                 Route pages and the shared root layout
  components/          Reusable presentation components
  constants/           Product values, statuses, roles, and routes
  lib/supabase/        Browser/server Supabase client factories
  services/            Data access boundary; currently demo data only
supabase/
  migrations/          Version-controlled database changes
  config.toml          Local Auth, Storage, and database configuration
docs/
  DATA_MODEL.md        Planned entities and security boundaries
  PRODUCT_DECISIONS.md Confirmed rules and open decisions
  ROADMAP.md           Ordered implementation phases
```

## Foundation rules

- Public pages may use demo data, but must not pretend backend actions work.
- Authentication and authorization must be enforced server-side and with
  Supabase Row Level Security.
- The admin workspace must not appear in public navigation and must reject
  unauthorized access even when someone knows its URL.
- Anonymous posts remain privately linked to their owner.
- Admins may edit submission metadata, but not replace the original photo.
- Every moderation change must be attributable and auditable.

See the `docs` directory before implementing a new product workflow.
