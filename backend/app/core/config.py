import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/assetflow"

    # JWT
    jwt_secret: str = "change-me-to-a-strong-random-secret"
    jwt_expire_hours: int = 24

    # CORS
    cors_origins: str = "http://localhost:5173"

    # Seed
    seed_admin_email: str = "admin@assetflow.io"
    seed_admin_password: str = "Admin@123"

    # File uploads
    upload_dir: str = "./uploads"
    upload_max_bytes: int = 5_242_880  # 5 MB
    upload_allowed_ext: str = "jpg,jpeg,png,webp,pdf"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def allowed_extensions(self) -> set[str]:
        return {e.strip().lower() for e in self.upload_allowed_ext.split(",")}

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
