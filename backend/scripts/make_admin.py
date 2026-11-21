import asyncio
import sys
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models import User

async def main(email: str):
    async with AsyncSessionLocal() as session:
        async with session.begin():
            user = await session.scalar(select(User).where(User.email == email))
            if not user:
                print(f"Користувача з email '{email}' не знайдено.")
                return
            
            user.is_admin = True
            print(f"Користувач {user.display_name} ({user.email}) успішно став адміністратором!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Використання: python -m scripts.make_admin <user_email>")
        sys.exit(1)
        
    email = sys.argv[1]
    asyncio.run(main(email))
