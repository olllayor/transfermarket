# Central Asia Football Data Backend (Uzbekistan-first)

Production-oriented backend for a Transfermarkt-style football data platform.

## Features (MVP)

- Canonical entities: Players, Clubs, Competitions, Matches, Transfers, News
- Public REST API with pagination, filtering and full-text search
- JWT auth + role-based access (admin/editor/public)
- Admin endpoints for edits, verification and merging duplicates
- Ingestion pipeline (CSV import + normalization + dedupe)
- OpenAPI (Swagger) docs
- MongoDB indexes for search & common filters
- Rate limiting, validation, structured errors, health checks

## Quickstart (Docker)

```bash
cp .env.example .env
docker compose up --build
```

API:
- http://localhost:3000/api
Swagger:
- http://localhost:3000/docs

## Local dev

```bash
npm ci
npm run start:dev
```

## Seed sample Uzbek data

```bash
npm run seed
```

This inserts a small set of real-world Uzbek clubs and a few well-known Uzbek players/transfers for development/testing.

## Environment variables

See `.env.example`.
