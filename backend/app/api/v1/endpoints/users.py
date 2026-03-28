from typing import Any
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

@router.get("/me/favorites")

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