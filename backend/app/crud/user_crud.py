from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app import models, deps, schemas
from app.core import security
from app.core.config import settings

def create_user(db: Session, user_in: schemas.UserCreate):
    # 檢查使用者名稱是否已存在
    user = db.query(models.User).filter(models.User.username == user_in.username).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="該使用者名稱已被註冊",
        )
    
    # 建立新使用者物件
    db_obj = models.User(
        username=user_in.username,
        password_hashed=security.get_password_hash(user_in.password),
        role_id=user_in.role_id
    )
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    return db_obj