# Roop

Storefront and order CRM for Roop, a hand-embroidered clothing brand.

- `web/`: Next.js storefront and admin panel (port 3000).
- `api/`: FastAPI backend with SQLite (port 8000). To use Postgres, set `DATABASE_URL`.

The web server sends every `/api` request to the API. Thus, the browser uses one origin.

## Setup

You need [uv](https://docs.astral.sh/uv/) and Node.js 20 or later.

```bash
cd api
cp .env.example .env      # Then set JWT_SECRET and SEED_ADMIN_PASSWORD.
uv sync
uv run alembic upgrade head
uv run python seed.py     # Adds the admin user and sample products.
cd ../web
npm install
```

## Run

```bash
./dev.sh
```

- Shop: http://localhost:3000
- Admin: http://localhost:3000/admin. Sign in with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.
- API docs: http://localhost:8000/docs

## Check

```bash
cd api && uv run pytest -q && uv run ruff check .
cd web && npm run lint && npm run build
```

## Rules

- Money is an integer in paisa (1 rupee = 100). The web app formats it with `money()`.
- The server calculates every order total. Stock decreases when a customer orders. Stock increases if staff cancel.
- Delivered and cancelled orders are final.
- To change the brand name or currency, edit `web/src/lib/config.ts` and `CURRENCY` in `api/.env`.
- To change a table, edit `api/app/models.py`. Then run `uv run alembic revision --autogenerate -m "..."`.

## Production notes

- Set a long random `JWT_SECRET` and `COOKIE_SECURE=true`.
- Set `API_URL` for the web server if the API is not at `http://127.0.0.1:8000`.
- Back up the database file, or use Postgres.
