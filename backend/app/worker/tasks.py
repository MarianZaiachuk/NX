from __future__ import annotations

import asyncio

from app.db.session import AsyncSessionLocal
from app.services.trading import process_expired_trades
from app.worker.celery_app import celery_app


@celery_app.task(name="trades.close_expired")
def close_expired_trades() -> int:
    """Celery beat task that closes expired AI trades.

    Multiple workers can run this task safely. PostgreSQL row locks with
    SKIP LOCKED ensure only one worker can claim and complete a trade.
    """

    async def _run() -> int:
        async with AsyncSessionLocal() as session:
            return await process_expired_trades(session)

    return asyncio.run(_run())

