from typing import Generator, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError, ExpiredSignatureError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app import models, schemas

from app.core import security
from app.core.config import settings
from app.db.session import SessionLocal

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)

def get_db() -> Generator:
    """
    提供資料庫 Session 依賴
    """
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db), 
    token: str = Depends(reusable_oauth2)
) -> models.User:
    """
    驗證 Token 並回傳當前登入的使用者物件
    """
    try:
        # 1. 解碼 JWT Token
        # jose 會自動檢查 exp 欄位，如果過期會拋出 ExpiredSignatureError
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        # 2. 將內容轉換為 Pydantic 模型驗證格式 (檢查 sub 欄位)
        token_data = schemas.TokenPayload(**payload)
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="憑證已過期，請重新登入",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="無法驗證憑證",
        )
    
    # 3. 從資料庫查找使用者
    user = db.query(models.User).filter(models.User.id == token_data.sub).first()
    if not user:
        raise HTTPException(status_code=404, detail="使用者不存在")
    
    return user

class RoleChecker:
    """
    權限檢查器依賴項工廠。
    使用方式: current_user: models.User = Depends(deps.RoleChecker([0, 1]))
    """
    def __init__(self, allowed_roles: List[int]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: models.User = Depends(get_current_user)) -> models.User:
        if current_user.role_id not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="您的權限不足，無法執行此操作",
            )
        return current_user