from pathlib import Path
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR.parent / "data"
# 設定 SQLite 資料庫檔案路徑
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATA_DIR}/db.sqlite"

# 建立資料庫引擎
# connect_args={"check_same_thread": False} 是 SQLite 專給 FastAPI 用的必要設定
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 建立 Session 類別
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 建立 Model 的基底類別
Base = declarative_base()

# --- 定義資料表模型 ---

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hashed = Column(String, nullable=False)
    role_id = Column(Integer, default=0)

    # 關聯：一個使用者可以有多個收藏
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")


class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    path = Column(String, unique=True, index=True, nullable=False)
    type_id = Column(Integer, nullable=False)
    parent_id = Column(Integer, ForeignKey("files.id", ondelete="CASCADE"), nullable=True)
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 自我關聯：資料夾與檔案的層級結構
    children = relationship("File", cascade="all, delete-orphan")
    # 關聯：一個檔案可以被多人收藏
    favorited_by = relationship("Favorite", back_populates="file", cascade="all, delete-orphan")
    
    # 關聯：音樂檔案對應的字幕
    subtitles = relationship(
        "Subtitle", 
        back_populates="music_file", 
        primaryjoin="File.id == Subtitle.music_file_id",
        cascade="all, delete-orphan"
    )


class Favorite(Base):
    __tablename__ = "favorites"

    # 複合主鍵：user_id + file_id
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    file_id = Column(Integer, ForeignKey("files.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 建立雙向關聯，方便查詢
    user = relationship("User", back_populates="favorites")
    file = relationship("File", back_populates="favorited_by")


class Subtitle(Base):
    __tablename__ = "subtitles"

    # 複合主鍵 (Composite PK)
    music_file_id = Column(Integer, ForeignKey("files.id", ondelete="CASCADE"), primary_key=True)
    subtitle_file_id = Column(Integer, ForeignKey("files.id", ondelete="CASCADE"), primary_key=True)
    extension = Column(String, nullable=False)

    # 建立與音樂檔案的關聯
    music_file = relationship("File", foreign_keys=[music_file_id], back_populates="subtitles")
    # 建立與字幕檔案實體的關聯
    subtitle_file = relationship("File", foreign_keys=[subtitle_file_id])


# --- 初始化資料庫的函式 ---

def init_db():
    # 這行指令會根據上面的 Class 自動在 SQLite 中建立所有資料表
    print("正在建立資料表...")
    Base.metadata.create_all(bind=engine)
    print("資料庫初始化完成！")

if __name__ == "__main__":
    init_db()
