import asyncio
from app.db.session import engine
from app.db.base import Base
import app.models  # Required to register all models with Base
from sqlalchemy import text

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    migrations = [
        "ALTER TABLE users ADD COLUMN phone VARCHAR(20) UNIQUE;",
        "ALTER TABLE users ADD COLUMN has_received_first_deposit_bonus BOOLEAN DEFAULT false;",
        "ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'Pending';",
        "ALTER TABLE users ADD COLUMN has_signals_access BOOLEAN DEFAULT false;",
        "ALTER TABLE users ADD COLUMN has_signals_access BOOLEAN DEFAULT false;",
        "ALTER TABLE users ADD COLUMN total_deposit NUMERIC(18, 2) DEFAULT 0 NOT NULL;",
        "ALTER TABLE users ADD COLUMN spot_balance NUMERIC(18, 2) DEFAULT 0 NOT NULL;",
        "ALTER TABLE users ADD COLUMN referral_bonus_paid BOOLEAN DEFAULT false;",
        "ALTER TABLE withdrawals ADD COLUMN fee NUMERIC(18, 2) DEFAULT 0 NOT NULL;",
        "UPDATE users SET referral_code = CAST(uid AS VARCHAR);"
    ]
    
    for m in migrations:
        try:
            async with engine.begin() as conn:
                await conn.execute(text(m))
        except Exception as e:
            print(f"Migration skipped (likely already exists): {m}")

    print("Database tables created successfully!")

if __name__ == "__main__":
    asyncio.run(init_db())
