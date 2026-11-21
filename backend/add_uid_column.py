import asyncio
from sqlalchemy import text
from app.db.session import engine

async def add_uid_column():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN uid NUMERIC(10, 0) UNIQUE"))
            print("Added uid column")
            
            # Populate existing rows
            await conn.execute(text("UPDATE users SET uid = floor(random() * 89999999 + 10000000) WHERE uid IS NULL"))
            await conn.execute(text("CREATE INDEX ix_users_uid ON users(uid)"))
            print("Populated existing rows")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(add_uid_column())
