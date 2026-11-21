import asyncio
from sqlalchemy import text
from app.db.session import engine

async def main():
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS has_received_first_deposit_bonus BOOLEAN NOT NULL DEFAULT FALSE;"))
        print("Column added successfully.")

if __name__ == "__main__":
    asyncio.run(main())
