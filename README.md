# Recovery Log

A single-user fitness recovery journal. Log a training session, then record how you
felt the next day — pain rating, steps, carbs, intensity, sleep, hydration, RPE,
soreness areas and free-text comments — and see which of those actually correlate
with how sore you end up.

Built to be phone-first (installable as a PWA) and to run on free tiers only.

## Stack

- Next.js 16 (App Router, Server Actions, Turbopack)
- React 19 + Tailwind CSS v4
- Drizzle ORM on Neon serverless Postgres
- Recharts for the insight charts

## Data model

One row per training session, keyed by a unique `session_date`. Logging the same
date twice edits the existing entry instead of creating a duplicate.

Built-in fields are real typed columns. Any custom field you add in **Fields** is
stored in the `entries.custom` JSONB blob, keyed by an allowlisted, slug-validated
key. Hiding a custom field never deletes its historical values.

## Local setup

```powershell
npm install
Copy-Item .env.example .env.local
```

Put a Postgres connection string in `.env.local`:

```
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
```

Get one either by running `vercel install neon` (provisions Neon through the Vercel
Marketplace and injects `DATABASE_URL` into your project automatically), or by
creating a project at neon.tech and copying the **pooled** connection string.

Create the tables, then start the dev server:

```powershell
npm run db:push
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:push` | Push schema straight to the DB (quickest) |
| `npm run db:generate` | Generate a SQL migration into `drizzle/` |
| `npm run db:migrate` | Apply generated migrations |
| `npm run db:studio` | Drizzle Studio |

## Deploying to Vercel (free)

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project** and import the repo. The defaults are correct;
   no build settings need changing.
3. Attach a database: in the project's **Storage** tab choose **Neon**, or run
   `vercel install neon` from the project directory. Either way `DATABASE_URL` is
   set for you. If you brought your own Postgres, add `DATABASE_URL` manually under
   **Settings → Environment Variables** for all environments.
4. Deploy.
5. Apply the schema once against the production database — set `DATABASE_URL` in
   your local `.env.local` to the production string and run `npm run db:push`.
6. On your phone, open the deployed URL and use **Add to Home Screen** to install it.

### Free-tier limits worth knowing

- **Neon Free**: 0.5 GB storage and 100 compute-hours per project per month — far
  beyond what a few hundred training entries need. The compute scales to zero after
  5 minutes idle and this cannot be disabled, so the first request after a quiet
  period takes an extra second or so to wake up.
- **Vercel Hobby**: free but licensed for non-commercial use only, which personal
  training logs are.

## Security

**There is no authentication.** This was a deliberate choice for friction-free
logging: anyone who knows the URL can read, add, edit and delete entries. The
deployed URL is the only thing protecting the data, so treat it as a secret and
don't share it. `robots` is set to `noindex, nofollow` so it won't be crawled into
search results.

If you later want a lock on it, the cleanest option is Vercel's built-in
password protection on the deployment, which needs no code changes.

## Import and export

**Import** accepts pasted Samsung Notes-style blocks (separated by blank lines) or
CSV, auto-detecting which. It parses day-first and ISO dates, previews every row
with its errors before anything is written, and warns you when a row would
overwrite an existing date. The commit step re-parses the text server-side rather
than trusting the previewed payload.

**Export** is a JSON backup of all entries and field definitions at `/api/export`,
linked from the Import screen.

## Insights

Correlations are Pearson's *r* between each numeric factor and your pain rating,
computed only where at least 3 paired observations exist. Below 8 entries the page
shows a low-confidence warning — with a handful of sessions the numbers are noise.
Correlation is not causation; treat these as prompts to investigate, not conclusions.

## Known advisories

`npm audit` reports 4 moderate issues, all from `esbuild` bundled inside
`drizzle-kit`. The advisory only affects esbuild's local dev server; `drizzle-kit`
is a devDependency and none of it ships in the deployed bundle. Fixing it requires
downgrading `drizzle-kit` by 12 minor versions, so it's been left alone.
