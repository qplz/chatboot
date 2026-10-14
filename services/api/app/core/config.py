"""Application configuration via Pydantic Settings."""
from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application
    app_env: str = "development"
    app_name: str = "ai-chatbot-mvp"
    app_secret_key: SecretStr
    frontend_url: str = "http://localhost:3000"
    api_base_url: str = "http://localhost:8000"

    # Database
    postgres_db: str = "ai_chatbot"
    postgres_user: str = "ai_chatbot_app"
    postgres_password: SecretStr
    database_url: SecretStr

    # Authentication
    jwt_secret_key: SecretStr
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # LLM — provider: mock | openai | local
    llm_provider: str = "mock"
    openai_api_key: SecretStr | None = None
    openai_model: str = "gpt-4o-mini"
    local_llm_base_url: str | None = None
    local_llm_model: str | None = None

    # Embedding — provider: mock | local | openai
    # mock: random vectors (testing only)
    # local: sentence-transformers all-MiniLM-L6-v2 (recommended for local dev)
    # openai: text-embedding-3-small
    embedding_provider: str = "mock"
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dimension: int = 384

    # Ingestion
    ocr_provider: str = "placeholder"
    max_upload_size_mb: int = 25
    allowed_upload_extensions: str = "pdf,png,jpg,jpeg"
    chunk_size: int = 800
    chunk_overlap: int = 120
    retrieval_top_k: int = 5

    # Storage
    storage_backend: str = "local"
    upload_dir: str = "/app/data/uploads"

    # Observability
    log_level: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("embedding_dimension")
    @classmethod
    def positive_dimension(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("embedding_dimension must be > 0")
        return v

    @field_validator("max_upload_size_mb", "retrieval_top_k")
    @classmethod
    def positive_limits(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Value must be > 0")
        return v

    @property
    def allowed_extensions_list(self) -> list[str]:
        return [e.strip().lower() for e in self.allowed_upload_extensions.split(",")]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


settings = Settings()
