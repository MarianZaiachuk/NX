from __future__ import annotations

import asyncio
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select

from app.db.base import Base
from app.db.session import AsyncSessionLocal, engine
from app.models import Trade, User  # noqa: F401 - imports register metadata

DEMO_USER_ID = UUID("32196215-0000-4000-8000-000000000001")


async def main() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        async with session.begin():
            existing = await session.scalar(select(User).where(User.id == DEMO_USER_ID))
            if existing is None:
                from app.core.security import get_password_hash
                session.add(
                    User(
                        id=DEMO_USER_ID,
                        email="demo@nx.local",
                        display_name="Marian-Oleksii",
                        hashed_password=get_password_hash("password123"),
                        balance=Decimal("588.03"),
                    )
                )


if __name__ == "__main__":
    asyncio.run(main())

