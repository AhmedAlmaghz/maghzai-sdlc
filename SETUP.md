# Local Setup

## 1. Local development database

Local development uses SQLite by default. The app creates the database file and tables automatically on first use.

```env
DATABASE_PROVIDER=sqlite
SQLITE_DATABASE_PATH=./data/dev.db
```

Start the app:

```powershell
npm run dev
```

Then open the local URL printed by Next.js.

## 2. Optional AI provider credentials

AI provider API keys are optional. If they are not configured, project generation falls back to the deterministic generator.

```env
# Google Gemini (official API)
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_API_KEY=alternative_google_api_key

# OpenAI (official or compatible APIs like FreeModel)
OPENAI_API_KEY=your_openai_api_key_here
AI_OPENAI_API_KEY=alternative_openai_key
OPENAI_MODEL=gpt-5.5
AI_OPENAI_MODEL=alternative_openai_model
OPENAI_BASE_URL=https://api.openai.com/v1
AI_OPENAI_BASE_URL=https://api.freemodel.dev  # OpenAI-compatible custom endpoint

# OpenCode / opencode models (configurable OpenAI-compatible provider)
OPENCODE_API_KEY=your_opencode_api_key_here
AI_OPENCODE_API_KEY=alternative_opencode_key
OPENCODE_MODEL=opencode-model
AI_OPENCODE_MODEL=alternative_opencode_model
OPENCODE_BASE_URL=http://localhost:4096/v1
AI_OPENCODE_BASE_URL=alternative_opencode_endpoint

# Mistral AI
MISTRAL_API_KEY=your_mistral_api_key_here
AI_MISTRAL_API_KEY=alternative_mistral_key
MISTRAL_MODEL=mistral-large-latest
AI_MISTRAL_MODEL=alternative_mistral_model
MISTRAL_BASE_URL=https://api.mistral.ai/v1
AI_MISTRAL_BASE_URL=alternative_mistral_endpoint

# Groq
GROQ_API_KEY=your_groq_api_key_here
AI_GROQ_API_KEY=alternative_groq_key
GROQ_MODEL=llama-3.3-70b-versatile
AI_GROQ_MODEL=alternative_groq_model
GROQ_BASE_URL=https://api.groq.com/openai/v1
AI_GROQ_BASE_URL=alternative_groq_endpoint

# Custom Gemini endpoint (if using OpenAI-compatible proxy)
GEMINI_BASE_URL=optional_custom_gemini_endpoint
```

### AI SDK Features

This project uses [AI SDK](https://ai-sdk.dev) (Vercel AI SDK) for AI model integration:

- **Providers**: Supports Google Gemini, OpenAI-compatible APIs, OpenCode/opencode-compatible endpoints, Mistral, and Groq
- **Structured output**: Uses Zod schemas for type-safe JSON responses
- **Fallback**: Automatically falls back to deterministic generation if AI fails
- **Examples**: See `src/lib/ai-examples.ts` for usage patterns

### Best Practices for AI Integration

1. **API Keys Security**: Never commit API keys. Use `.env.local` (gitignored)
2. **Model Selection**: Use `gemini-3.5-flash` for speed, `gemini-3.1-flash-lite` for complex tasks
3. **Temperature Settings**: 
   - 0.1-0.3 for deterministic/factual responses
   - 0.4-0.7 for creative content generation
4. **Error Handling**: All AI calls have fallback to deterministic generation
5. **Token Limits**: Responses are automatically truncated at 200,000 characters

## 3. Production PostgreSQL

Use PostgreSQL in production by setting:

```env
DATABASE_PROVIDER=postgres
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
```

### Applying database migrations (IMPORTANT for Vercel / Postgres)

This project uses Drizzle ORM with committed migration files in the `drizzle/`
directory. Generated migration SQL is applied with `drizzle-kit migrate`, or the
schema can be synced directly with `drizzle-kit push`.

The app itself **never creates tables at runtime** — Vercel functions are
stateless, so table creation must happen outside the runtime, before/independent
of deployment.

#### Step 1 — Configure environment variables

Locally, create `.env.local` with the Postgres connection string. On Vercel, add
the same variables under **Project → Settings → Environment Variables** (Vercel
Postgres users: the values are under **Storage → Postgres → Connect → .env.local**):

```env
DATABASE_PROVIDER=postgres
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

`POSTGRES_URL` is also supported by `drizzle.config.ts` as a fallback for
`DATABASE_URL`.

#### Step 2 — Generate migration files (only when the schema changes)

```powershell
npm run db:generate
```

This writes new SQL files under `drizzle/` (e.g. `drizzle/0000_xxx.sql`) and the
meta snapshots under `drizzle/meta/`. **Commit these files** — they are not
gitignored.

#### Step 3 — Apply migrations to a database

Use `drizzle-kit migrate` (applies committed migrations in order) or
`drizzle-kit push` (syncs schema directly; useful for prototyping):

```powershell
# Apply committed migrations (recommended for production)
npm run db:migrate

# OR push the schema directly (no migration history)
npm run db:push
```

Both commands read the connection string from `DATABASE_URL`/`POSTGRES_URL` in
your `.env.local` (or from the current shell environment).

#### Step 4 — Deploying to Vercel with migrations

Vercel build containers are ephemeral and `drizzle-kit migrate` must not be
expected to run automatically on every deployment without care. Recommended
approaches:

1. **Run migrations from your local machine** (or CI) against the production
   Postgres before/after deploying — no runtime code changes needed:

   ```powershell
   # Windows (PowerShell) — point DATABASE_URL at the Vercel Postgres string
   $env:DATABASE_PROVIDER="postgres"
   $env:DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST>:5432/<DBNAME>?sslmode=require"
   npm run db:migrate
   ```

   ```bash
   # macOS/Linux/CI — with the Vercel Postgres connection string exported
   DATABASE_PROVIDER=postgres DATABASE_URL="postgresql://..." npm run db:migrate
   ```

2. **Alternatively, run migrations as a one-time step in the Vercel CLI**:

   ```powershell
   vercel env pull .env.local && npm run db:migrate
   ```

3. **Or trigger migrations from a CI/CD job** (e.g. GitHub Actions) after the
   Vercel deploy, using the same `db:migrate` command with `DATABASE_URL` from
   Vercel Secrets.

After the tables exist, redeploy the app (or simply hit it again) — the
`42P01: relation "projects" does not exist` error will be gone.

#### Vercel Postgres quick reference

- Find the connection string: **Vercel Dashboard → Storage → Postgres → Connect
  → .env.local** (it exposes `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`, etc.).
- The app reads `DATABASE_URL` at runtime (see `src/db/index.ts`); set it in
  Vercel environment variables or re-export the Postgres string to that name.
- Never commit real connection strings — `.env*.local` and `.env` are gitignored.

## 4. Local PostgreSQL option

If you want to test production-like PostgreSQL locally, run:

```powershell
docker run --name research-paper-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=app_db -p 5432:5432 -d postgres:16
```

If the container already exists, start it with:

```powershell
docker start research-paper-postgres
```

Then switch `.env.local` to `DATABASE_PROVIDER=postgres` and add `DATABASE_URL`.

## Troubleshooting

### Production SSR error is masked ("An error occurred in the Server Components render...")

In production builds Next.js hides the real error message and only keeps a
`digest` value. The actual error is still written to the Vercel logs server-side.
Every page that renders from the database (`/`, `/projects`, `/templates`,
`/settings`, `/builder`) calls the DB directly from a Server Component with no
try/catch, so any DB failure surfaces as this generic error.

Two causes are by far the most likely, in order:

1. **Migrations were never applied to the Vercel Postgres database.** The tables
   (`projects`, `settings`, `templates`) do not exist yet, so the first query
   fails with `42P01: relation "projects" does not exist`. This is a runtime
   data issue — the app **never** creates Postgres tables automatically
   (`src/db/index.ts` only auto-creates SQLite tables). Fix: run the migration
   commands from "Applying database migrations" (section 3, step 3/4) against
   the Vercel Postgres connection string, then redeploy / hit the page again.

2. **`DATABASE_URL` is not set in the Vercel project's environment variables.**
   The runtime only reads `DATABASE_URL` (see `src/db/index.ts`); Vercel
   Postgres auto-exposes `POSTGRES_URL` (and `POSTGRES_URL_NON_POOLING`) under
   **Storage → Postgres → Connect → .env.local**, but those are **not** read by
   the app. Set `DATABASE_URL` to the `POSTGRES_URL` value in
   **Project → Settings → Environment Variables** (e.g.
   `postgresql://user:password@host:5432/dbname?sslmode=require`).

**How to confirm which one it is:**

- Open **Vercel Dashboard → Project → Logs (Runtime Logs)** and look for the
  Server Component error. It will contain either
  `42P01: relation "projects" does not exist` (cause 1) or
  `DATABASE_URL is required when DATABASE_PROVIDER=postgres` (cause 2), with a
  matching `digest`.
- Or call the health endpoint: **`https://<your-app>.vercel.app/api/health`**.
  It only runs `SELECT 1`, so:
  - `{"ok":false}` → the app cannot reach Postgres at all →
    `DATABASE_URL`/connection problem (cause 2).
  - `{"ok":true}` but pages still error → the DB connection works but the
    tables are missing → migrations not applied (cause 1).

Also, a root `src/app/error.tsx` boundary now logs `error.digest`, `message`,
and `cause` to the server console and shows the digest in the UI so you can
cross-reference the masked production error with the real message in Vercel logs.

### Other common issues

- `DATABASE_URL is required`: this only applies when `DATABASE_PROVIDER=postgres` or `NODE_ENV=production`.
- SQLite file is not created: confirm the app can write to the project directory and `SQLITE_DATABASE_PATH` points to a writable path.
- `ECONNREFUSED 127.0.0.1:5432`: PostgreSQL is not running or is listening on a different port.
- Authentication failed: update `DATABASE_URL` to match your PostgreSQL username and password.
- Database does not exist: create `app_db` or change the database name in `DATABASE_URL`.
