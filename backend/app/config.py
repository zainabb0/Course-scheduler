# ================================================================
#  config.py — Application Settings
#  Reads from .env file automatically via pydantic-settings
# ================================================================

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── App ─────────────────────────────────────────────────────
    app_name: str = "AI Course Scheduler"
    app_version: str = "1.0.0"
    debug: bool = False
    allowed_origins: list[str] = ["http://localhost:5173"]

    # ── Database ────────────────────────────────────────────────
    postgres_user: str = "scheduler_user"  # قيمة افتراضية
    postgres_password: str = "scheduler_pass"  # قيمة افتراضية
    postgres_db: str = "scheduler_db"  # قيمة افتراضية
    postgres_host: str = "localhost"
    postgres_port: int = 5432

    @property
    def database_url(self) -> str:
        """Async URL for SQLAlchemy"""
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def database_url_sync(self) -> str:
        """Sync URL for Alembic migrations"""
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