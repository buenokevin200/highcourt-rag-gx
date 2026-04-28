from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    app_name: str = "HighCourt RAG"
    debug: bool = False
    database_url: str = "sqlite:///./data/highcourt.db"
    chroma_host: str = "chromadb"
    chroma_port: int = 8001
    chroma_collection: str = "highcourt_sentencias"
    upload_dir: str = "/app/data/uploads"
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 480

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
