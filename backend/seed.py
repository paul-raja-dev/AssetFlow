import asyncio
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.user import User
from sqlalchemy import select

async def seed():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == "admin@assetflow.io"))
        admin = result.scalar_one_or_none()
        if not admin:
            print("Seeding admin user...")
            new_admin = User(
                email="admin@assetflow.io",
                password_hash=hash_password("Admin@123"),
                first_name="System",
                last_name="Administrator",
                role="ADMIN",
                status="ACTIVE",
            )
            session.add(new_admin)
            await session.commit()
            print("Admin user seeded successfully!")
        else:
            print("Admin user already exists.")

if __name__ == "__main__":
    asyncio.run(seed())
