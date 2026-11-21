import asyncio
from app.db.base import Base
from app.db.session import engine
from app.models.transaction import Deposit, Withdrawal # Import to register with Base

async def init_db():
    async with engine.begin() as conn:
        print("Creating phase 2 tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("Done!")

if __name__ == "__main__":
    asyncio.run(init_db())
