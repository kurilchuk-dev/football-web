# football-web

Frontend for the football team website: news, matches and the tournament table.

Backend repository: `football-api`

## Tech stack

- React + TypeScript
- Vite
- React Router
- TanStack Query (data fetching)
- ESLint + Prettier

## Getting started

```bash
git clone <repo-url> football-web
cd football-web

npm install
cp .env.example .env             # set the API URL
npm run dev
```

App: http://localhost:5173

## Environment variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API URL, e.g. `http://localhost:8000/api` |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |

## Workflow

- `main` is always stable; work happens in feature branches (`feature/news-page`).
- Every change goes through a Pull Request.
- Commit style: `feat: add news list page`, `fix: table layout on mobile`.

## Roadmap

- [ ] Project setup and CI
- [ ] Home page and layout
- [ ] News list and details
- [ ] Matches and tournament table
- [ ] Responsive design
