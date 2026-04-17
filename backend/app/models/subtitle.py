from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import File
from app.db.base import Base

class Subtitle(Base):
    __tablename__ = "subtitles"

    # 複合主鍵 (Composite PK) 同時也是指向 files.id 的外鍵
    music_file_id: Mapped[int] = mapped_column(
        ForeignKey("files.id", ondelete="CASCADE"), 
        primary_key=True
    )
    subtitle_file_id: Mapped[int] = mapped_column(
        ForeignKey("files.id", ondelete="CASCADE"), 
        primary_key=True
    )
    
    # 儲存字幕檔的副檔名 (例如: vtt, srt, lrc)
    extension: Mapped[str] = mapped_column(String, nullable=False)

    # --- 關聯設定 ---

    # 關聯到音樂檔案：一個音樂檔案可以有多個字幕
    music_file: Mapped["File"] = relationship(
        "File", 
        foreign_keys=[music_file_id], 
        back_populates="subtitles"
    )
    
    # 關聯到作為字幕本身的檔案紀錄
    subtitle_file: Mapped["File"] = relationship(
        "File", 
        foreign_keys=[subtitle_file_id]
    )

    def __repr__(self) -> str:
        return f"<Subtitle(music_id={self.music_file_id}, sub_id={self.subtitle_file_id}, ext='{self.extension}')>"
