from __future__ import annotations

from celery import Celery

from app.core.config import settings


celery_app = Celery(
    "nx_trading_worker",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.worker.tasks"],
)

from celery.schedules import crontab

celery_app.conf.update(
    timezone="UTC",
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        "close-expired-ai-trades": {
            "task": "trades.close_expired",
            "schedule": crontab(minute=25, hour='12,16,20'),
        },
    },
)

