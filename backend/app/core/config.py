from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120

    ROLE_ADMIN: int = 1
    ROLE_USER: int = 2

    @property
    def MUSIC_DIR(self) -> Path:
        BASE_DIR = Path(__file__).resolve().parent
        return BASE_DIR.parent.parent / "music"
    
    @property
    def DATABASE_URL(self) -> str:
        BASE_DIR = Path(__file__).resolve().parent
        DATA_DIR = BASE_DIR.parent / "data"
        return f"sqlite:///{DATA_DIR}/db.sqlite"

    model_config = SettingsConfigDict(env_file=".env")
    
settings = Settings()
        