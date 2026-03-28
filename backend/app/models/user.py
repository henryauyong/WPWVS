from sqlalchemy import String, Column, Integer
from sqlalchemy.orm import relationship

from app.db.base import BaseWithId

class User(BaseWithId):
    __tablename__ = "users"

    # 使用者名稱：設定為唯一值且加上索引以優化登入查詢速度
    username = Column(String(50), unique=True, index=True, nullable=False)
    
    # 儲存雜湊後的密碼：絕對不要存明文
    password_hashed = Column(String(255), nullable=False)

    # 權限：預設為 0
    role_id = Column(Integer, default=0)

    # --- 關聯設定 ---
    
    # 建立與 Favorite (收藏表) 的一對多關聯
    # back_populates: 指向 Favorite Model 裡定義的 'user' 變數
    # cascade: 當使用者帳號被刪除時，自動刪除該使用者的所有收藏紀錄 (delete-orphan)
    favorites = relationship(
        "Favorite", 
        back_populates="user", 
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"