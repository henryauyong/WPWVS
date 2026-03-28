from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# 1. 建立資料庫引擎
# pool_pre_ping=True 能自動檢查並重新連接斷開的連線
engine = create_engine(
    settings.DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

# 2. 建立 SessionLocal 類別，這將在每個請求中被實例化
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)