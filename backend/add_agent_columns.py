import asyncio
from app.db.session import engine
from sqlalchemy import text

async def main():
    async with engine.begin() as conn:
        print("Adding agent_level to users table...")
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_level INTEGER NOT NULL DEFAULT 0;"))
        print("Adding last_weekly_payout_at to users table...")
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_weekly_payout_at TIMESTAMP WITH TIME ZONE;"))
        print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
