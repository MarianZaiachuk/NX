[Українською](README.uk.md)

# NX

Crypto exchange simulator with an async FastAPI backend, PostgreSQL, Celery/Redis worker, and a mobile-first React frontend.

**Live demo:** [marianzaiachuk.github.io/NX](https://marianzaiachuk.github.io/NX/) — static GitHub Pages build using a browser `localStorage` mock API (`VITE_DEMO_MODE=true`) and public Binance market data.

## Architecture

- **Backend (`backend/`)**: FastAPI, SQLAlchemy async + `asyncpg`, JWT authentication, Celery + Redis beat worker.
- **Frontend (`frontend/`)**: React 18, Vite, Tailwind CSS, Framer Motion, TradingView Lightweight Charts.

### Concurrency & Database

Core models live in `backend/app/models` (`User`, `Trade`, `Deposit`, `Withdrawal`, `KycRecord`, `GlobalSettings`). Trade execution and payout settlement in `backend/app/services/trading.py`:

- Trade creation locks the user row with `SELECT ... FOR UPDATE`, deducts the stake (`$9.00`), inserts an `IN_PROGRESS` trade, and commits immediately.
- Expired trades are claimed by Celery (`trades.close_expired` every minute) with `FOR UPDATE SKIP LOCKED` so multiple workers don't process the same trade twice.
- User rows are locked in deterministic UUID order during batch payouts to avoid deadlocks.
- `asyncpg` pool defaults: `pool_size=20`, `max_overflow=40`, `pool_pre_ping=True`, `READ COMMITTED`.

### Main API Endpoints

- `POST /api/auth/login`, `POST /api/auth/register` — JWT auth
- `GET /api/users/me/state` — current balances, active/latest trade, and profile state
- `POST /api/trades/delegate` — deduct `$9.00` and start a simulated trade
- `GET /api/trades/status/{trade_id}` — check trade state (closes trade if already expired)
- `POST /api/wallet/transfer`, `POST /api/wallet/deposit`, `POST /api/wallet/withdraw`, `GET /api/wallet/history`
- `GET /api/admin/users`, `PATCH /api/admin/users/{user_id}`, `GET /api/admin/withdrawals`, `GET /api/admin/settings`

## Local Setup

Start PostgreSQL and Redis:

```bash
docker compose up -d db redis
```

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m scripts.init_db
python -m scripts.seed_demo
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Worker:

```bash
cd backend
.venv\Scripts\activate
celery -A app.worker.celery_app worker --beat --loglevel=info
```

Frontend:

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:5173`. Or run the whole stack with `docker compose up -d --build`.

## Static Demo Build

To build the serverless demo (used on `gh-pages`):

```bash
cd frontend
VITE_DEMO_MODE=true VITE_BASE_PATH=/NX/ npm run build
```

## License

[MIT](LICENSE)
