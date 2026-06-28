# SpaceTag

Upload a room image. AI tags what it sees. Save, organize, and compare spaces across projects.

## Architecture

- **Frontend:** Next.js App Router + TypeScript + Tailwind CSS
- **AI proxy:** All Gemini calls go through `/api/analyze` — the API key never touches the client
- **Async flow:** Upload → `PROCESSING` status → frontend polls every 2s → tags render without page refresh
- **Persistence:** Each analysis is stored with image data and JSON annotations in PostgreSQL via Prisma
- **Deploy:** Vercel

## Screens

1. **Upload** — pick an image, hit Analyze, see tags (room type, furniture, materials, lighting, colors)
2. **Gallery** — all saved spaces as cards; click through for full annotations
3. **Compare** — pick any two spaces for a side-by-side tag review

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Set `DATABASE_URL` to your PostgreSQL connection string and `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey).

Without `GEMINI_API_KEY`, the app runs in **demo mode** with sample annotations so you can test the full flow locally.

### 3. Run database migrations

```bash
npm run db:migrate
```

Or for a quick schema push without migration history:

```bash
npm run db:push
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/spaces` | GET | List all saved spaces |
| `/api/spaces` | POST | Upload image (multipart `image` field) |
| `/api/spaces/[id]` | GET | Fetch one space (used for polling) |
| `/api/analyze` | POST | Start async analysis `{ "spaceId": "..." }` |

### Testing Gemini in isolation

Before wiring up the UI, you can hit the analyze endpoint directly:

```bash
# 1. Upload an image
curl -X POST http://localhost:3000/api/spaces \
  -F "image=@room.jpg"

# 2. Start analysis (use the id from step 1)
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"spaceId":"YOUR_SPACE_ID"}'

# 3. Poll until status is DONE or FAILED
curl http://localhost:3000/api/spaces/YOUR_SPACE_ID
```

## Deploy on Vercel

1. Push to GitHub and import the repo in Vercel
2. Add `DATABASE_URL` and `GEMINI_API_KEY` in Project Settings → Environment Variables
3. Deploy — `postinstall` runs `prisma generate` automatically
4. Run migrations against your production database:

```bash
npx prisma migrate deploy
```

## Failure handling

- **Gemini timeout (30s):** space status set to `FAILED`; user sees error + Retry on Upload screen
- **Invalid image:** rejected at upload with a clear message
- **Missing API key:** demo annotations returned; previous analyses unaffected
- **Database errors:** graceful error banners on Gallery and API responses

## Out of scope

No auth, 360° viewer, annotation editing, or sharing/collaboration — single-user portfolio demo.
