import asyncio
from sqlalchemy import update
from app.db.session import AsyncSessionLocal
from app.models import User

async def act():
    async with AsyncSessionLocal() as s:
        async with s.begin():
            await s.execute(update(User).where(User.email == 'demo@nx.local').values(has_signals_access=True))
            print("Signals activated for demo@nx.local")

asyncio.run(act())
