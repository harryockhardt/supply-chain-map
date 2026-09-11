# Local development

The five original planning documents were copied unchanged from SC Tracker. This file records implementation progress separately so their locked product contract is preserved.

## Milestones

ROADMAP.md is authoritative: Milestone 0 is the local app foundation; Milestone 1 is Supabase/database setup. Earlier conversational numbering differed.

The app currently displays only a title. Reserved route folders do not implement authentication or features. No database or external service connection is configured.

## Run

Use Node.js 24 (the version is recorded in .nvmrc). From the repository folder:

```sh
npm ci
npm run dev -- --hostname 127.0.0.1
```

Open http://localhost:3000. Stop the server with Control-C.

## Validate

```sh
npm run lint
npm run typecheck
npm run build
```

ESLint checks the code; EditorConfig records consistent whitespace settings. Dependency versions are recorded in package-lock.json. No external fonts are fetched during builds.

## Next external step

Milestone 1 needs a Supabase project. Its owner must sign in and create/select the project before we connect and apply versioned migrations. Local environment files are excluded from Git. Do not put privileged credentials in client code or Git.

GitHub is not required to run the app locally. Connecting a remote repository can follow the local baseline.

## Verification — 11 September 2026

- All five source documents match the supplied originals byte for byte.
- ESLint and TypeScript checks passed.
- Production build passed using Next.js Webpack support.
- Development server opened successfully at http://127.0.0.1:3000; browser showed the expected application title.
- The default Turbopack build was blocked by a local process/port restriction, including after an elevated retry. Development/build scripts use the supported Webpack option for this environment; this does not change the application architecture.

Milestone 0 baseline is implemented. Milestone 1 is not started: Supabase login/project selection is the next external step.
