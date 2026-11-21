import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def main():
    engine = create_async_engine("postgresql+asyncpg://nx:nx@localhost:5432/nx_simulator")
    async with engine.begin() as conn:
        # Add fund_password_hashed to users
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN fund_password_hashed VARCHAR(255);"))
            print("Added fund_password_hashed to users.")
        except Exception as e:
            print(f"Column might already exist: {e}")
            
        # Create email_verifications table
        try:
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS email_verifications (
                    id UUID PRIMARY KEY,
                    email VARCHAR(320) NOT NULL,
                    code VARCHAR(6) NOT NULL,
                    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
                );
            """))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_email_verifications_email ON email_verifications(email);"))
            print("Created email_verifications table.")
        except Exception as e:
            print(f"Table creation error: {e}")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
