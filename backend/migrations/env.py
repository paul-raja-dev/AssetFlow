import asyncio
import os
import sys
from logging.config import fileConfig
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import pool

from alembic import context

# ── Make `app` importable from migrations/ ───────────────────────────────────
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# Load .env so DATABASE_URL is available
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import Base + all models so autogenerate sees every table
from app.core.database import Base  # noqa: E402

import app.models  # registers all models with Base.metadata  # noqa: F401, E402

target_metadata = Base.metadata

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:password@localhost:5432/assetflow",
)


def run_migrations_offline() -> None:
    """Offline mode — emit SQL to stdout without a live connection."""
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Online async mode."""
    connectable = create_async_engine(DATABASE_URL, poolclass=pool.NullPool)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
