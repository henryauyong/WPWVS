import subprocess
import os
import shutil
from typing import Any, Optional, Set, List, Tuple
from sqlalchemy.orm import Session
from pathlib import Path

from app import models, deps, schemas
from app.core.config import settings

ALLOWED_MUSIC_EXTENSIONS = {".mp3", ".wav", ".flac", ".m4a", ".aac", ".ogg", ".mp4", ".webm"}
ALLOWED_SUBTITLE_EXTENSIONS = {".vtt", ".lrc"}
MUSIC_DIR = settings.MUSIC_DIR

def is_mp4_faststart(path: str) -> bool:
    """
    檢查 MP4 檔案的 moov atom 是否位於 mdat 之前 (即是否已優化)。
    """
    try:
        with open(path, "rb") as f:
            # 遍歷 MP4 Atoms
            while True:
                header = f.read(8)
                if len(header) < 8:
                    break
                size = int.from_bytes(header[0:4], "big")
                atom_type = header[4:8]
                if atom_type == b"moov":
                    return True
                if atom_type == b"mdat":
                    return False
                if size < 8: # 異常情況
                    break
                # 跳轉到下一個 atom (扣除已讀取的 8 bytes)
                f.seek(size - 8, os.SEEK_CUR)
    except Exception:
        pass
    return False

def optimize_mp4(file_path: str):
    """
    使用 ffmpeg 執行 -movflags +faststart 優化，讓前端可直接獲取長度並串流。
    """
    if not file_path.lower().endswith(".mp4"):
        return
    
    # 如果已經優化過，直接跳過
    if is_mp4_faststart(file_path):
        return

    temp_path = file_path + ".tmp.mp4"
    try:
        # -c copy: 不重新編碼，極速處理
        # -movflags +faststart: 將索引移至檔案開頭
        cmd = [
            "ffmpeg", "-y", "-i", file_path,
            "-c", "copy", "-map", "0",
            "-movflags", "+faststart",
            temp_path
        ]
        # 執行並等待完成
        subprocess.run(cmd, check=True, capture_output=True)
        # 取代原檔
        shutil.move(temp_path, file_path)
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        print(f"Failed to optimize {file_path}: {e}")

def sync_files_with_disk(db: Session):
    """
    同步資料庫與實際檔案，並自動關聯音樂與字幕。
    """
    # 1. 讀取現有清單
    existing_files = db.query(models.File).all()
    existing_paths_set: Set[str] = {f.path for f in existing_files}
    # 建立路徑對應 ID 的快取，用於設定子項目的 parent_id
    path_to_id = {f.path: f.id for f in existing_files}
    
    # 用於儲存本次掃描到的音樂檔案，後續進行字幕匹配
    music_file_paths: List[str] = []

    root_path = Path(MUSIC_DIR).resolve()
    if not root_path.exists():
        return

    # 2. 定義遞迴掃描函數
    def scan_recursive(current_dir: Path, parent_id: Optional[int] = None):
        try:
            for item in current_dir.iterdir():
                # 忽略隱藏檔案
                if item.name.startswith('.'):
                    continue

                path_str = str(item.resolve())
                suffix = item.suffix.lower()

                # 決定 type_id: 1=folder, 2=music, 3=subtitle
                type_id = None
                if item.is_dir():
                    type_id = 1
                elif suffix in ALLOWED_MUSIC_EXTENSIONS:
                    type_id = 2
                    music_file_paths.append(path_str)
                    
                    # 針對 MP4 進行 Faststart 優化
                    if suffix == ".mp4":
                        optimize_mp4(path_str)
                elif suffix in ALLOWED_SUBTITLE_EXTENSIONS:
                    type_id = 3
                
                # 如果不是這三種類型，跳過
                if type_id is None:
                    continue

                if path_str in existing_paths_set:
                    # 檔案依然存在，從待刪除集合中移除
                    existing_paths_set.remove(path_str)
                    item_id = path_to_id.get(path_str)
                else:
                    # 說明是新檔案或資料夾 -> 存入資料庫
                    new_file = models.File(
                        name=item.name,
                        path=path_str,
                        type_id=type_id,
                        parent_id=parent_id
                    )
                    db.add(new_file)
                    db.flush() # 取得自增 ID
                    item_id = new_file.id
                    path_to_id[path_str] = item_id

                # 如果是資料夾，遞迴進入
                if type_id == 1:
                    scan_recursive(item, item_id)
        except PermissionError:
            pass # 略過權限不足的目錄

    # 開始遞迴掃描
    scan_recursive(root_path)

    # 3. 處理字幕關聯 (匹配 music.mp4 -> music.mp4.vtt)
    # 讀取現有的字幕關聯以避免重複插入
    existing_subs = db.query(models.Subtitle).all()
    sub_pair_set = {(s.music_file_id, s.subtitle_file_id) for s in existing_subs}

    for m_path in music_file_paths:
        m_id = path_to_id.get(m_path)
        if not m_id:
            continue
            
        # 檢查該音樂檔案是否有對應的字幕檔
        for s_ext in ALLOWED_SUBTITLE_EXTENSIONS:
            # 根據需求：音樂檔名全名 + 字幕副檔名 (例如: song.mp3.vtt)
            potential_sub_path = m_path + s_ext
            
            if potential_sub_path in path_to_id:
                s_id = path_to_id[potential_sub_path]
                
                # 如果這對關聯尚未存在於資料庫，則建立它
                if (m_id, s_id) not in sub_pair_set:
                    new_sub = models.Subtitle(
                        music_file_id=m_id,
                        subtitle_file_id=s_id,
                        extension=s_ext.lstrip('.') # 儲存如 "vtt" 而非 ".vtt"
                    )
                    db.add(new_sub)
                    sub_pair_set.add((m_id, s_id))

    # 4. 處理剩餘資料 (批量刪除已從磁碟消失的檔案)
    if existing_paths_set:
        paths_list = list(existing_paths_set)
        # 批量刪除，防止 SQLite 參數限制
        for i in range(0, len(paths_list), 900):
            chunk = paths_list[i:i+900]
            db.query(models.File).filter(models.File.path.in_(chunk)).delete(synchronize_session=False)

    db.commit()
