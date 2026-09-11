# Supply Chain Disruption Map

Local blank application for Milestone 1. This README describes the scaffold; it is not the original generated README, which has not transferred from ChatGPT.

## Run locally

Use Node.js 24, then run these commands from this folder:

```sh
npm ci
npm run dev -- --hostname 127.0.0.1
```

Open http://localhost:3000. Stop the server with Control-C.

## Checks

```sh
npm run lint
npm run typecheck
npm run build
```

## Agreed stack and structure

Next.js App Router, React, TypeScript and Tailwind CSS. Later milestones use MapLibre GL JS and Supabase Auth, PostgreSQL/PostGIS and database row-level security.

- `app/`: pages; only the home page is implemented.
- `components/`: map, incident and layout components.
- `lib/`: Supabase, authentication, incident and map logic.
- `types/`: shared TypeScript types.
- `supabase/migrations/`: versioned database changes.
- `docs/`: original project documents, pending transfer.

Empty folders reserve the layout confirmed in the prior conversation. No incident model, authentication, map or database is implemented yet. Git is local; no remote account is required to run this app.

## Milestone status

- Milestone 0: incomplete until the original README.md, PRODUCT.md, DATA_MODEL.md, ARCHITECTURE.md and ROADMAP.md are supplied and checked.
- Milestone 1: blank application scaffolded; see the session handoff for verification results.
- Milestone 2: Supabase connection, deferred until the source documents are available.

See [document transfer status](docs/DOCUMENT_STATUS.md). Do not infer missing specifications from this scaffold.
