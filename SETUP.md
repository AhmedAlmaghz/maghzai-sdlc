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

Create or update PostgreSQL tables before deployment:

```powershell
npx drizzle-kit push
```

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

- `DATABASE_URL is required`: this only applies when `DATABASE_PROVIDER=postgres` or `NODE_ENV=production`.
- SQLite file is not created: confirm the app can write to the project directory and `SQLITE_DATABASE_PATH` points to a writable path.
- `ECONNREFUSED 127.0.0.1:5432`: PostgreSQL is not running or is listening on a different port.
- Authentication failed: update `DATABASE_URL` to match your PostgreSQL username and password.
- Database does not exist: create `app_db` or change the database name in `DATABASE_URL`.
