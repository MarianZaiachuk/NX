import asyncio
from app.db.session import engine
from sqlalchemy import text

async def add_phone_column():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(20) UNIQUE;"))
            print("Successfully added phone column to users table.")
        except Exception as e:
            print(f"Error (maybe column already exists): {e}")

if __name__ == "__main__":
    asyncio.run(add_phone_column())
