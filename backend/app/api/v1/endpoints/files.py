from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app import schemas, deps, models
from app.core import security
from app.core.config import settings
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