from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload

from app import schemas, deps, models
from app.crud import file_crud

router = APIRouter()

@router.post("/refresh", status_code=status.HTTP_202_ACCEPTED)
async def refresh_files(
    *,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
) -> Any:
    """
    觸發檔案系統與資料庫同步。
    僅限登入使用者執行。
    """
    background_tasks.add_task(file_crud.sync_files_with_disk, db)
    return {"message": "同步任務已啟動，請稍候。"}

@router.get("/folder/{id}", response_model=schemas.FolderResponse)
def get_folder(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
) -> Any:
    """
    回傳該資料夾的資料，與 parent_id=該資料夾 id 的所有檔案跟資料夾。
    當 id=0 時，回傳根目錄（parent_id=0）的內容。
    """
    if id == 0:
        children = db.query(models.File).options(joinedload(models.File.subtitles)).filter(models.File.parent_id == None).all()
        # 建立一個虛擬的根資料夾資訊
        root_folder = {
            "id": 0,
            "name": "Root",
            "path": "/",
            "type_id": 1,
            "parent_id": None,
            "subtitles": []
        }
        return {"folder": root_folder, "children": children}

    folder = db.query(models.File).options(joinedload(models.File.subtitles)).filter(models.File.id == id, models.File.type_id == 1).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    children = db.query(models.File).options(joinedload(models.File.subtitles)).filter(models.File.parent_id == id).all()
    return {"folder": folder, "children": children}

@router.get("/folder/{folder_id}/path")
def get_folder_path(
    folder_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
) -> Any:
    """
    回傳從最頂層到目前資料夾的路徑陣列。
    """
    if folder_id == 0:
        return [{"id": "0", "name": "Root"}]

    path_list = []
    current_id = folder_id

    while current_id is not None:
        folder = db.query(models.File).filter(models.File.id == current_id, models.File.type_id == 1).first()
        if not folder:
            if current_id == folder_id:
                raise HTTPException(status_code=404, detail="Folder not found")
            break

        path_list.append({"id": str(folder.id), "name": folder.name})
        current_id = folder.parent_id

    # 反轉陣列，讓最頂層的資料夾排在最前面
    path_list.reverse()
    
    # 最前面補上虛擬的根目錄
    path_list.insert(0, {"id": "0", "name": "Root"})

    return path_list

@router.get("/music/{id}")
def get_music(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
) -> Any:
    """
    回傳音樂檔案的 FileResponse。
    """
    file = db.query(models.File).filter(models.File.id == id, models.File.type_id == 2).first()
    if not file:
        raise HTTPException(status_code=404, detail="Music file not found")
    return FileResponse(file.path)

@router.get("/music/{id}/duration")
def get_music_duration(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
) -> Any:
    """
    回傳音樂檔案的長度 (秒)。
    """
    file = db.query(models.File).filter(models.File.id == id, models.File.type_id == 2).first()
    if not file:
        raise HTTPException(status_code=404, detail="Music file not found")
    return {"duration": file.duration}

@router.head("/subtitle/{music_id}")
@router.get("/subtitle/{music_id}")
def get_subtitle(
    music_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
) -> Any:
    """
    透過音樂 ID 查詢關聯的字幕檔並回傳 FileResponse。
    """
    subtitle_entry = db.query(models.Subtitle).filter(models.Subtitle.music_file_id == music_id).first()
    if not subtitle_entry:
        raise HTTPException(status_code=404, detail="Subtitle not found for this music")
    
    file = db.query(models.File).filter(models.File.id == subtitle_entry.subtitle_file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="Subtitle file record not found")
        
    return FileResponse(file.path)

@router.get("/search", response_model=List[schemas.File])
def search_files(
    q: str,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
) -> Any:
    """
    搜尋包含指定字串的檔案或資料夾。
    """
    if not q or not q.strip():
        return []
        
    # 搜尋資料夾(1)與音樂(2)，忽略獨立的字幕檔(3)，並包含字幕的預先載入
    results = db.query(models.File).options(
        joinedload(models.File.subtitles)
    ).filter(
        models.File.name.ilike(f"%{q.strip()}%"),
        models.File.type_id.in_([1, 2])
    ).all()
    
    return results