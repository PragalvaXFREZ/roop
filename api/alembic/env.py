"""
Alembic migration setup.

Alembic uses the same DATABASE_URL and the same tables as the app.
To add a migration, change app/models.py. Then run:
    uv run alembic revision --autogenerate -m "describe the change"
"""

from logging.config import fileConfig

from alembic import context
from app import models  # noqa: F401  (registers the tables)
from app.config import settings
from app.db import Base, make_engine

if context.config.config_file_name:
    fileConfig(context.config.config_file_name)


def run() -> None:
    url = settings.database_url
    if context.is_offline_mode():
        context.configure(url=url, target_metadata=Base.metadata, literal_binds=True)
        with context.begin_transaction():
            context.run_migrations()
        return
    with make_engine(url).connect() as conn:
        context.configure(
            connection=conn,
            target_metadata=Base.metadata,
            render_as_batch=url.startswith("sqlite"),
        )
        with context.begin_transaction():
            context.run_migrations()


run()
