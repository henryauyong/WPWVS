from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

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
        children = db.query(models.File).filter(models.File.parent_id == None).all()
        # 建立一個虛擬的根資料夾資訊
        root_folder = {
            "id": 0,
            "name": "Root",
            "path": "/",
            "type_id": 1,
            "parent_id": None
        }
        return {"folder": root_folder, "children": children}

    folder = db.query(models.File).filter(models.File.id == id, models.File.type_id == 1).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    children = db.query(models.File).filter(models.File.parent_id == id).all()
    return {"folder": folder, "children": children}

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