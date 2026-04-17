from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# 1. 建立資料庫引擎
# pool_pre_ping=True 能自動檢查並重新連接斷開的連線
engine = create_engine(
    settings.DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

# 確保 SQLite 開啟外鍵約束 (Foreign Key Constraints)，讓 ON DELETE CASCADE 正常運作
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

# 2. 建立 SessionLocal 類別，這將在每個請求中被實例化
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)