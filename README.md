# website-regenerator-front-end

Next.js (App Router) frontend for the AI Website Regenerator. Lets a user
submit a URL and an optional theme, kicks off the regeneration pipeline, and
shows live progress as the two backend Lambdas
([`webpage-crawler-lambda`](../webpage-crawler-lambda) and
[`ai-css-regeneration-lambda`](../ai-css-regeneration-lambda)) work through
the job.

## What it does

- **Home page** (`src/app/page.tsx`) — form to submit a website URL and
  optional regeneration theme.
- **Submit flow** — `POST /api/regenerate-website`
  (`src/app/api/regenerate-website/route.ts`): authenticates the user via
  Supabase (an anonymous session is created on submit if none exists),
  sends a message to SQS (consumed by `webpage-crawler-lambda`) with
  `{RegeneratedWebsiteId, RegeneratedWebsiteUrl, RegenerationTheme}`, and
  records the job in the Supabase `regenerations` table, then redirects to
  `/regenerated-website/[id]`.
- **Live progress page**
  (`src/app/regenerated-website/[id]/page.tsx`) — subscribes to the Ably
  channel `regeneration:{id}` (auth token minted by
  `/api/ably-auth`) and renders progress through the pipeline's steps
  (crawling → extracting CSS/images → regenerating HTML → queueing AI →
  chunking → regenerating CSS → finalizing), deduplicating out-of-order
  events by sequence number. Shows a loading state while in progress, and
  either the finalized result or a failure state when done
  (`components/LoadingRegeneratedWebsite`,
  `FinalizedRegeneratedWebsite`, `FailedRegeneratedWebsite`).
- **Result lookup** — `GET /api/get-regenerated-website`
  (queries DynamoDB directly for a job's current record) backs the result
  page as a fallback/complement to the Ably stream.
- **History page** (`src/app/history/page.tsx`) — lists a signed-in user's
  past regenerations from Supabase, linking back to each result page.
- **Auth** — Supabase Auth, supporting anonymous sessions (created
  transparently on first submit, `lib/supabase/ensureAnonymousSession.ts`)
  as well as email/password login and registration
  (`src/app/auth/login`, `src/app/auth/register`).

## Stack

- Next.js 16 / React 19 / TypeScript
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`) — auth + `regenerations` history table
- AWS SDK v3 (`@aws-sdk/client-sqs`, `@aws-sdk/client-dynamodb`) — queues jobs, reads job status
- Ably (`ably`) — real-time progress updates pushed from the Lambdas

## Environment variables

See `.env.example` / `.env.template`:

- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `DYNAMODB_TABLE_NAME`
- `SQS_QUEUE_URL` — queue that `webpage-crawler-lambda` consumes
- `ABLY_API_KEY` — used server-side by `/api/ably-auth` to mint client tokens
- `RESULT_BASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_DEPLOYED_URL`

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Deployed on AWS Amplify.
