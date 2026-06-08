# ================================================================
#  config.py — Application Settings
#  Reads from .env file automatically via pydantic-settings
# ================================================================

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = ROOT_DIR / ".env"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ─────────────────────────────────────────────────────
    app_name: str = "AI Course Scheduler"
    app_version: str = "1.0.0"
    debug: bool = False
    allowed_origins: list[str] = ["http://localhost:5173"]

    # ── Database ────────────────────────────────────────────────
    database_url_env: str | None = Field(None, env="DATABASE_URL")
    postgres_user: str = "scheduler_user"  # قيمة افتراضية
    postgres_password: str = "scheduler_pass"  # قيمة افتراضية
    postgres_db: str = "scheduler_db"  # قيمة افتراضية
    postgres_host: str = "localhost"
    postgres_port: int = 5432

    def _normalize_database_url(self, url: str, driver: str) -> str:
        if url.startswith(f"postgresql+{driver}://"):
            return url
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", f"postgresql+{driver}://", 1)
        return url

    @property
    def database_url(self) -> str:
        """Async URL for SQLAlchemy"""
        if self.database_url_env:
            return self._normalize_database_url(self.database_url_env, "asyncpg")
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def database_url_sync(self) -> str:
        """Sync URL for Alembic migrations"""
        if self.database_url_env:
            return self._normalize_database_url(self.database_url_env, "psycopg2")
        return (
            f"postgresql+psycopg2://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    # ── Security ────────────────────────────────────────────────
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480  # 8 hours

    # ── AI Engine ───────────────────────────────────────────────
    ga_default_generations: int = 100
    ga_default_population_size: int = 50
    ga_default_mutation_rate: float = 0.02
    ga_default_crossover_rate: float = 0.8


@lru_cache
def get_settings() -> Settings:
    """
    Cached settings instance.
    Use as FastAPI dependency: settings = Depends(get_settings)
    Or import directly: from app.config import settings
    """
    return Settings()


# Ready-to-import singleton
settings = get_settings()