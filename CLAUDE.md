# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A full-stack fitness app for seniors with two roles: **senior** (`idoso`) and **tutor**.
Monorepo, 3-tier (React SPA → REST API → Postgres). Originally a Figma Make
prototype, now containerized. **User-facing text and domain vocabulary are in
Brazilian Portuguese** (categories like `Alongamento`/`Equilíbrio`, error
`detail` strings, UI labels) — keep new strings consistent with that.

## Commands

Everything runs through Docker Compose; Node/Python/Postgres are not needed on the host.

```bash
docker compose up --build          # start db + backend + frontend (first run seeds the DB)
docker compose down                # stop
docker compose down -v             # stop AND wipe the DB volume (see "No migrations" below)
docker compose logs -f backend     # tail one service (backend | frontend | db)
```

- Frontend: http://localhost:5173 (override host port with `FRONTEND_PORT` in `.env` if 5173 is taken)
- API + Swagger docs: http://localhost:8000 / http://localhost:8000/docs
- Code is bind-mounted, so edits hot-reload: Vite (frontend) and uvicorn `--reload` (backend).

Running a piece directly (rarely needed; prefer compose):
- Frontend: `cd frontend && npm install && npm run dev` (build: `npm run build`)
- Backend: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload`

**There is no test suite, linter, formatter, or `tsconfig.json` typecheck step** —
none are configured. Don't look for them or assume a `npm test` / `pytest` exists.

Demo logins (seeded): `maria@exemplo.com` / `123456` is the fully-populated senior;
`ana@exemplo.com` / `admin123` is a tutor. See README for the full list.

## Architecture

### Request flow
Browser → `frontend/src/lib/api.ts` (typed client) → `fetch('/api/*')` → Vite dev
proxy (`vite.config.ts`, target `VITE_PROXY_TARGET`, default `localhost:8000`) →
FastAPI routers mounted under `/api` in `backend/app/main.py`.

`frontend/src/lib/api.ts` is the **contract between the two halves** and the single
source of truth for endpoints and response shapes. Its TypeScript interfaces mirror
the backend Pydantic `*Out` schemas field-for-field. **API JSON is camelCase**:
response schemas hand-declare camelCase fields (e.g. `friendsDone`, `groupName`),
and routes build these DTOs explicitly (`ExerciseOut(id=..., ...)`) rather than
serializing ORM objects directly — so adding a field means touching the model, the
schema, the route's DTO construction, and `api.ts`.

### Frontend shape
The app is two large single-file experiences, not a routed component tree:
- `src/app/App.tsx` — the **senior** app (exercises / friends / groups tabs) plus
  the root: it owns auth/session and chooses what to render.
- `src/app/components/TutorApp.tsx` — the **tutor** dashboard (seniors overview,
  groups, announcements, activities, live events).
- `src/app/components/ui/*` — shadcn/Radix primitives (generated; usually leave alone).

Auth: JWT stored in `localStorage` under `sf_token` (see `getToken`/`setToken`).
On load the root calls `api.me()` to restore the session, then renders `App`'s
senior UI when `session.role === "senior"`, else `TutorApp`. Exercise/category
icons are sent from the backend as **logical names** (`"heart"`, `"footprints"`)
and mapped to lucide-react icons client-side.

### Backend shape (`backend/app/`)
Domain-oriented layers, one concern per directory:
- `core/` — `config.py` (env-driven `Settings`), `database.py` (engine, `SessionLocal`,
  `Base`, `get_db` per-request dependency), `security.py` (PBKDF2 hashing via stdlib +
  PyJWT HS256 tokens).
- `models/` — SQLAlchemy 2.0 models. **Every model must be imported in
  `models/__init__.py`** so `Base.metadata` sees it before `create_all`.
- `schemas/` — Pydantic request (`*In`, snake_case) and response (`*Out`, camelCase) models.
- `api/routes/` — one router per domain: `auth`, `exercises`, `friends`, `groups`, `tutor`.
- `api/deps.py` — auth dependencies: `get_current_user`, and role guards
  `require_senior` / `require_tutor` (the whole tutor router is gated by `require_tutor`).
- `db/seed.py` — idempotent demo seed; **no-ops if any user already exists**.
- `main.py` — app factory + lifespan: waits for Postgres, `Base.metadata.create_all`,
  runs `seed()`, registers routers under `/api`, CORS.

### No migrations (important)
The schema is created from the models via `Base.metadata.create_all` on startup —
there is **no Alembic / migration tooling**. `create_all` only creates missing
tables; it will **not** alter an existing table. After changing a model's columns,
reset the database to pick them up:

```bash
docker compose down -v && docker compose up --build
```

### Adding a backend feature
1. Model in `models/`, and import it in `models/__init__.py`.
2. Request/response schemas in `schemas/` (`*In` snake_case, `*Out` camelCase).
3. Router in `api/routes/`, building `*Out` DTOs explicitly; register it in `main.py`.
4. Add the endpoint + matching TypeScript types to `frontend/src/lib/api.ts`.
5. Reset the DB (`down -v`) if you added/changed columns.

## Domain modeling notes
- Two roles only, on `User.role`: `"senior"` and `"tutor"`.
- An `Activity` is a reusable template the tutor can dispatch; dispatching snapshots
  it into a `RunningActivity` bound to one group, which seniors see via
  `/exercises/assigned` and complete (tracked by `RunningActivityCompletion`).
- Daily exercise completion is one row per `(user, exercise, day)`
  (`ExerciseCompletion`, unique-constrained); tutor dashboard stats (streaks,
  weekly counts, inactivity alerts) are computed from these rows in `tutor.py`.
- `GroupMessage` doubles as a chat line and a live-event card carrier (`event` JSON
  column with empty `text`); the tutor chat view skips the event-card rows.
