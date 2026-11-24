"""
Application settings.

The settings come from environment variables or from the file .env.
Change DATABASE_URL to use Postgres. Do not change the code.
"""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

API_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=API_DIR / ".env", extra="ignore")

    database_url: str = f"sqlite:///{API_DIR / 'roop.db'}"
    jwt_secret: str = "change-me"
    jwt_hours: int = 12
    cookie_secure: bool = False
    currency: str = "NPR"
    upload_dir: Path = API_DIR / "uploads"
    seed_admin_email: str = "admin@example.com"
    seed_admin_password: str = "change-me-now"


settings = Settings()
