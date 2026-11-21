import asyncio
from datetime import datetime, timezone
from sqlalchemy import update
from app.db.session import AsyncSessionLocal
from app.models import Trade

async def act():
    async with AsyncSessionLocal() as s:
        async with s.begin():
            await s.execute(update(Trade).values(unlock_time=datetime.now(timezone.utc)))
            print("Old trades set to expire now.")

asyncio.run(act())
