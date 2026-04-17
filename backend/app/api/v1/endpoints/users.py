from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app import schemas, deps, models
from app.core import security
from app.core.config import settings
from app.crud import user_crud

router = APIRouter()

@router.get("/me", response_model=schemas.User)
def read_user_me(
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    獲取當前登入的使用者資訊。
    """
    return current_user

@router.put("/me", response_model=schemas.User)
def update_user_me(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserUpdate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    更新當前使用者的資訊（名稱、密碼）。
    """
    if user_in.username is not None and user_in.username != current_user.username:
        # 檢查使用者名稱是否已存在
        user = db.query(models.User).filter(models.User.username == user_in.username).first()
        if user:
            raise HTTPException(
                status_code=400,
                detail="該使用者名稱已被註冊",
            )
        current_user.username = user_in.username
    
    if user_in.password is not None:
        current_user.password_hashed = security.get_password_hash(user_in.password)
        
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.get("/me/favorites", response_model=List[schemas.Favorite])
def read_favorites(
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    獲取當前使用者的收藏列表。
    """
    return current_user.favorites

@router.put("/me/favorites/{file_id}", status_code=status.HTTP_200_OK)
def toggle_favorite(
    file_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    切換檔案或資料夾的收藏狀態（加入或取消我的最愛）。
    """
    # 檢查檔案是否存在
    file = db.query(models.File).filter(models.File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    # 檢查是否已收藏
    favorite = db.query(models.Favorite).filter(
        models.Favorite.user_id == current_user.id,
        models.Favorite.file_id == file_id
    ).first()
    
    if favorite:
        db.delete(favorite)
        db.commit()
        return
    
    # 不存在則新增
    favorite = models.Favorite(user_id=current_user.id, file_id=file_id)
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    return

@router.post("/", response_model=schemas.User)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserCreate,
    current_user: models.User = Depends(deps.RoleChecker([settings.ROLE_ADMIN]))
) -> Any:
    """
    建立新使用者。
    可以用來建立管理員帳號 (role_id=1)。
    """
    return user_crud.create_user(db, user_in)