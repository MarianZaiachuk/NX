import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def main():
    engine = create_async_engine("postgresql+asyncpg://nx:nx@localhost:5432/nx_simulator")
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE users ADD COLUMN spot_balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00;"))
        print("Column added successfully!")
    await engine.dispose()

asyncio.run(main())
