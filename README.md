# football-web

The website of the «Черкаси ФАМ» team: next match, results and calendar, the tournament table and
the squad. It only reads data from the API (repository `football-api`).

## Tech stack

- React 19, TypeScript, Vite
- React Router, TanStack Query (cache saved in `localStorage`)
- CSS Modules, self-hosted Manrope and Unbounded fonts
- Vitest + Testing Library, oxlint, Prettier

## Getting started

Needs Node 22 and a running API.

```bash
npm install
echo "VITE_API_URL=http://localhost:8000/api" > .env
npm run dev          # http://localhost:5173
```

| Variable        | Description                                                           |
| --------------- | --------------------------------------------------------------------- |
| `VITE_API_URL`  | address of the API, with `/api`                                       |
| `VITE_SITE_URL` | address of the site; optional, for the sitemap and the social preview |

Both are built into the files, so a change needs a new build.

## Scripts

| Script            | What it does                                                        |
| ----------------- | ------------------------------------------------------------------- |
| `npm run dev`     | development server                                                  |
| `npm run build`   | typecheck and build into `dist/`                                    |
| `npm test`        | tests                                                               |
| `npm run check`   | typecheck, lint, format check and tests                             |
| `npm run gen:api` | regenerates `src/api/schema.d.ts` from the API running on port 8000 |

## Structure

| Folder            | Content                                               |
| ----------------- | ----------------------------------------------------- |
| `src/pages/`      | home, matches, standings, team, 404                   |
| `src/features/`   | logic and components by topic (matches, standings, …) |
| `src/components/` | shared interface parts (header, footer, notices, …)   |
| `src/api/`        | requests, generated types, caching and prefetching    |
| `vite-plugins/`   | build steps: data and font preloading, SEO files      |

## Things to know

- The standings rules are repeated in `src/features/standings/calculate.ts` for the simulator. They
  must match `standings/services.py` of the API; after a change run
  `scripts/standings_fixtures.py` and commit the new fixtures.
- A new page needs a route in `src/App.tsx`, and an entry in `SITE_ROUTES` (`vite.config.ts`) and in
  `ROUTE_PRELOADS` (`src/api/endpoints.ts`).

## Workflow

See [CONTRIBUTING.md](CONTRIBUTING.md) for branches, commits, pull requests and git hooks.
