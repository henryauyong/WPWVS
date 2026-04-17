from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app import schemas, deps, models
from app.core import security
from app.core.config import settings

router = APIRouter()

@router.post("/login", response_model=schemas.Token)
def login_access_token(
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    (V2 Shared) OAuth2 相容的登入接口，成功後回傳 Access Token。
    """
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    if not user or not security.verify_password(form_data.password, user.password_hashed):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="電子郵件或密碼錯誤",
            headers={"WWW-Authenticate": "Bearer"},
        )

    expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    access_token = security.create_access_token(
        user.id, expires_delta=expires_delta
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id
    }
