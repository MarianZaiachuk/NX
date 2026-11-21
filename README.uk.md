[English](README.md)

# NX

Симулятор криптобіржі на FastAPI, PostgreSQL, Celery/Redis та мобільно-орієнтованому React-інтерфейсі.

**Онлайн-демо:** [marianzaiachuk.github.io/NX](https://marianzaiachuk.github.io/NX/) — статична збірка на GitHub Pages із клієнтським мок-API у `localStorage` (`VITE_DEMO_MODE=true`) та живими котируваннями з публічного API Binance.

## Архітектура

- **Бекенд (`backend/`)**: FastAPI, асинхронний SQLAlchemy + `asyncpg`, JWT-авторизація, Celery + Redis.
- **Фронтенд (`frontend/`)**: React 18, Vite, Tailwind CSS, Framer Motion, TradingView Lightweight Charts.

### Робота з БД і конкурентністю

Основні моделі знаходяться в `backend/app/models` (`User`, `Trade`, `Deposit`, `Withdrawal`, `KycRecord`, `GlobalSettings`). Логіка угод у `backend/app/services/trading.py`:

- Під час відкриття угоди рядок користувача блокується через `SELECT ... FOR UPDATE`, списується `$9.00`, створюється угода зі статусом `IN_PROGRESS` і транзакція одразу комітиться.
- Завершені за часом угоди щохвилини забирає воркер Celery (`trades.close_expired`) через `FOR UPDATE SKIP LOCKED`, щоб паралельні воркери не обробляли ту саму угоду двічі.
- Для пакетних виплат рядки користувачів блокуються у відсортованому порядку UUID, щоб уникнути deadlock.
- Параметри пулу `asyncpg`: `pool_size=20`, `max_overflow=40`, `pool_pre_ping=True`, ізоляція `READ COMMITTED`.

### Основні ендпоінти

- `POST /api/auth/login`, `POST /api/auth/register` — авторизація через JWT
- `GET /api/users/me/state` — баланси, профіль і поточна/остання угода
- `POST /api/trades/delegate` — списати `$9.00` і запустити угоду
- `GET /api/trades/status/{trade_id}` — перевірити статус угоди
- `POST /api/wallet/transfer`, `POST /api/wallet/deposit`, `POST /api/wallet/withdraw`, `GET /api/wallet/history`
- `GET /api/admin/users`, `PATCH /api/admin/users/{user_id}`, `GET /api/admin/withdrawals`, `GET /api/admin/settings`

## Локальний запуск

Запуск PostgreSQL та Redis:

```bash
docker compose up -d db redis
```

Бекенд:

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

Воркер:

```bash
cd backend
.venv\Scripts\activate
celery -A app.worker.celery_app worker --beat --loglevel=info
```

Фронтенд:

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Після запуску інтерфейс доступний на `http://localhost:5173`. Увесь стек також можна підняти командою `docker compose up -d --build`.

## Збірка безсерверного демо

```bash
cd frontend
VITE_DEMO_MODE=true VITE_BASE_PATH=/NX/ npm run build
```

## Ліцензія

[MIT](LICENSE)
