# One Line Frames

One Line Frames is a quiet, student-focused platform for sharing one photo and
one short line. It is designed around curated moments rather than likes,
followers, comments, or algorithmic competition.

The application is currently in active beta development. Its core account,
submission, moderation, gallery, appeal, and removal workflows are connected to
Supabase.

## Current features

- Email/password registration, email confirmation, login, logout, session
  refresh, and password recovery.
- Protected profile, submission, and admin routes.
- Private image uploads with automatic width, height, and orientation
  detection.
- One-line submissions with categories, mood tags, and named, initialed,
  custom, or anonymous attribution.
- Private pending, rejected, published, and removed submission history.
- Admin review with publish, publish-with-edits, and reject decisions.
- Append-only moderation history with reasons visible to submission owners.
- One-time appeals for rejected submissions.
- User removal requests and direct admin removal.
- Featured moments and a single photo-of-the-week selection.
- Public Supabase-backed gallery with category filters, search, masonry and
  journal layouts, responsive image framing, fullscreen viewing, light/dark
  mode, and category-based visual themes.

## Stack

- Next.js App Router
- React
- Supabase Auth, Postgres, Storage, and Row Level Security
- `@supabase/ssr` for server-side authentication
- Global CSS in `src/app/globals.css`

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` and add the public values from the Supabase project
   settings:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

3. Start the development server:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

Never expose a Supabase secret or service-role key in a `NEXT_PUBLIC_*`
environment variable.

## Supabase setup

### Authentication

Enable email/password authentication and email confirmation in the Supabase
dashboard.

Add these development redirect URLs to the Auth URL configuration:

```text
http://localhost:3000/auth/confirm
http://127.0.0.1:3000/auth/confirm
```

Production deployments must add the exact production callback URL. Password
recovery also returns through `/auth/confirm` before opening
`/reset-password`.

### Database migrations

The `supabase/migrations` directory is the version-controlled database source
of truth. It currently includes:

- the initial schema and Row Level Security policies;
- submission creation, storage buckets, and moderation functions;
- hosted storage-policy repair;
- removal requests and direct removal;
- public image dimensions;
- featured and photo-of-the-week controls;
- one-time submission appeals.

For a linked hosted project, apply pending migrations with the Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

If the hosted schema was previously created manually in the SQL Editor, review
its migration history before running `db push`. Apply only migrations that have
not already been executed. The latest appeal migration is:

```text
supabase/migrations/20260615040000_appeal_workflow.sql
```

For a local Docker-backed Supabase environment:

```bash
npx supabase start
npx supabase db reset
```

### Storage

Migrations create two private buckets:

- `original-images` for immutable user uploads;
- `display-images` for approved gallery copies.

Both use a 25 MiB limit. Storage policies keep originals private, allow owners
and admins to view permitted files, and expose only approved display images
through controlled access.

### Admin accounts

Every admin must use an individual account. Admin status belongs in
`public.profiles.role`, not client-side metadata or shared credentials.

After creating and confirming an admin's normal Auth account, promote its
profile securely from the Supabase SQL Editor. The admin workspace is then
available from that account's profile after password re-verification. It is not
linked in public navigation.

## Commands

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Core workflow

1. A user registers and confirms their email.
2. The user uploads one image and submits one short line.
3. The private submission enters the pending admin queue.
4. An admin publishes it unchanged, publishes metadata edits with a reason, or
   rejects it with a reason.
5. Approved submissions appear in the gallery and the owner's published
   history.
6. A rejected submission may be appealed once.
7. A published submission may receive a user removal request or an audited
   direct admin removal.

## Manual testing checklist

Before a beta release, test the complete workflow with separate user and admin
accounts:

- signup and email confirmation;
- login, logout, session refresh, and password reset;
- valid and invalid image submissions;
- publish, publish-with-edits, and rejection;
- user-visible moderation history;
- one accepted appeal and one declined appeal;
- prevention of a second appeal on the same submission;
- featured and photo-of-the-week controls;
- removal request acceptance and rejection;
- direct admin removal;
- public gallery filtering, search, layouts, modal, and fullscreen image view;
- mobile, tablet, desktop, keyboard, reduced-motion, light, and dark modes.

## Project structure

```text
src/
  app/                 App Router pages, route handlers, and server actions
  components/          Reusable interface and workflow components
  constants/           Product limits, routes, database names, and statuses
  lib/                 Auth, image, audit-history, and Supabase helpers
  services/            Supabase-backed public and account data access
supabase/
  migrations/          Version-controlled schema and workflow changes
  config.toml          Local Auth, Storage, and database configuration
docs/
  DATA_MODEL.md        Entities and security boundaries
  PRODUCT_DECISIONS.md Confirmed requirements and open decisions
  ROADMAP.md           Ordered implementation phases
```

## Known limitations

- HEIC and HEIF originals can be uploaded, but admins cannot publish them until
  image conversion is implemented.
- Categories, tag rules, frame designs, and category themes are still
  provisional.
- Admin editing of already-published metadata is not complete.
- Privacy, consent, ownership, download, retention, and account-deletion
  policies still need final legal wording.
- Production notifications, monitoring, backups, rate limiting, and automated
  workflow tests are not complete.

## Security rules

- Authentication and authorization are enforced server-side and with Supabase
  Row Level Security.
- Protected routes validate signed claims through the Supabase SSR proxy.
- Anonymous posts remain privately linked to their owner.
- Original submitted photos cannot be replaced during moderation.
- Admin credentials are never shared.
- Moderation edits, decisions, highlights, appeals, and removals are audited.
- Public gallery queries return only approved, public-safe fields.
