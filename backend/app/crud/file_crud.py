from typing import Any, Optional, Set
from sqlalchemy.orm import Session
from pathlib import Path

from app import models, deps, schemas
from app.core.config import settings

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".flac", ".m4a", ".aac", ".ogg", ".mp4", ".mkv", ".webm", ".vtt"}
MUSIC_DIR = settings.MUSIC_DIR

def sync_files_with_disk(db: Session):
    """
    同步資料庫與實際檔案。
    1. 讀取現有清單：從資料庫取出所有目前的 path。
    2. 開始遞迴掃描：如果是新檔案則存入；如果已存在則從集合移除。
    3. 處理剩餘資料：集合剩下的路徑即為已刪除檔案，執行批量刪除。
    """
    # 1. 讀取現有清單
    existing_files = db.query(models.File).all()
    existing_paths_set: Set[str] = {f.path for f in existing_files}
    # 建立路徑對應 ID 的快取，用於設定子項目的 parent_id
    path_to_id = {f.path: f.id for f in existing_files}

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
                is_folder = item.is_dir()

                # 判斷是否為資料夾或是允許的副檔名
                if not is_folder and item.suffix.lower() not in ALLOWED_EXTENSIONS:
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
                        is_folder=is_folder,
                        parent_id=parent_id
                    )
                    db.add(new_file)
                    db.flush() # 取得自增 ID
                    item_id = new_file.id
                    path_to_id[path_str] = item_id

                # 如果是資料夾，遞迴進入
                if is_folder:
                    scan_recursive(item, item_id)
        except PermissionError:
            pass # 略過權限不足的目錄

    # 開始掃描
    scan_recursive(root_path)

    # 3. 處理剩餘資料 (批量刪除)
    if existing_paths_set:
        paths_list = list(existing_paths_set)
        # 批量刪除，防止 SQLite 參數限制 (通常是 999 筆參數)
        for i in range(0, len(paths_list), 900):
            chunk = paths_list[i:i+900]
            db.query(models.File).filter(models.File.path.in_(chunk)).delete(synchronize_session=False)

    db.commit()