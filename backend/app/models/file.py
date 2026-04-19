from typing import List, TYPE_CHECKING
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.sql import func

from app.db.base import BaseWithId

if TYPE_CHECKING:
    from .subtitle import Subtitle

class File(BaseWithId):
    __tablename__ = "files"

    name = Column(String, nullable=False)
    # path 設定為 unique=True 是為了確保「單次遍歷同步法」邏輯正常，避免重複路徑
    path = Column(String, unique=True, index=True, nullable=False)
    type_id = Column(Integer, nullable=False)
    
    # 指向自己資料表的 id，允許為空 (Root 目錄沒有 parent_id)
    # ondelete="CASCADE" 確保刪除資料夾時，裡面的檔案紀錄也會一併從資料庫移除
    parent_id = Column(
        Integer, 
        ForeignKey("files.id", ondelete="CASCADE"), 
        nullable=True
    )
    
    # 音樂檔案的長度 (秒)，資料夾與字幕檔保持 null
    duration = Column(Integer, nullable=True)
    
    # 自動更新掃描時間，用於判斷檔案是否還存在於硬碟上
    last_seen = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )

    # --- 關聯設定 ---

    # 1. 自我關聯：定義父子層級 (Adjacency List)
    # remote_side=[id] 告訴 SQLAlchemy 這是指向同表的父節點
    parent = relationship("File", remote_side="File.id", back_populates="children")
    children = relationship(
        "File", 
        back_populates="parent", 
        cascade="all, delete-orphan"
    )

    # 2. 與 Favorite 表的關聯
    # 讓你可以從檔案直接查出哪些使用者收藏了它
    favorited_by = relationship(
        "Favorite", 
        back_populates="file", 
        cascade="all, delete-orphan"
    )

    # 3. 與 Subtitle 表的關聯 (音樂檔案對應的字幕)
    # 一個音樂檔案可以有多個不同語言或格式的字幕檔
    subtitles: Mapped[List["Subtitle"]] = relationship(
        "Subtitle",
        back_populates="music_file",
        primaryjoin="File.id == Subtitle.music_file_id",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        type_map = {1: "Folder", 2: "Music", 3: "Subtitle"}
        type_str = type_map.get(self.type_id, "Unknown")
        return f"<{type_str}(id={self.id}, name='{self.name}')>"
