from datetime import datetime, timedelta, timezone
from typing import Any, Union
import bcrypt
from jose import jwt

from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    驗證明文密碼與資料庫中的雜湊密碼是否相符
    """
    plain_password = plain_password.encode('utf-8')
    hashed_password = hashed_password.encode('utf-8')

    return bcrypt.checkpw(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    將明文密碼轉換為雜湊字串（用於註冊或修改密碼）
    """
    password = password.encode('utf-8')
    return bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')


def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    """
    產生 JWT Access Token
    :param subject: 通常是使用者 ID 或唯一識別標識
    :param expires_delta: 過期時間。若為 None，則產生的 Token 將永久有效（不含 exp 欄位）
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = None

    # JWT Payload 內容
    # sub (Subject): 代表這個 Token 的主體（使用者 ID）
    to_encode = {"sub": str(subject)}
    
    # 如果有設定過期時間，才加入 exp 欄位
    if expire:
        to_encode.update({"exp": expire})

    # 使用 SECRET_KEY 與指定演算法簽名並加密
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt