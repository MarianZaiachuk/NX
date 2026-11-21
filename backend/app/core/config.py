from __future__ import annotations

from decimal import Decimal
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-driven settings.

    The database pool intentionally stays far below the expected concurrent user
    count. Async request handling lets 1000 clients wait without opening 1000
    PostgreSQL connections.
    """

    app_name: str = "NX Trading Simulator"
    api_prefix: str = "/api"

    database_url: str = Field(
        default="postgresql+asyncpg://nx:nx@localhost:5432/nx_simulator"
    )
    redis_url: str = "redis://localhost:6379/0"

    smtp_host: str | None = None
    smtp_port: int = 465
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_use_tls: bool = True
    smtp_start_tls: bool = False
    smtp_from_email: str | None = None
    
    resend_api_key: str | None = None

    nowpayments_api_key: str = ""
    nowpayments_ipn_secret: str = ""
    static_deposit_address: str | None = None

    secret_key: str = "dev-only-change-me-in-production"
    access_token_expire_minutes: int = 60 * 24 * 7 # 1 week

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    db_pool_size: int = 20
    db_max_overflow: int = 40
    db_pool_timeout_seconds: int = 10
    db_pool_recycle_seconds: int = 1800
    db_echo: bool = False

    trade_stake_amount: Decimal = Decimal("9.00")
    trade_payout_amount: Decimal = Decimal("12.00")
    trade_duration_minutes: int = 20
    trade_batch_size: int = 500

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

