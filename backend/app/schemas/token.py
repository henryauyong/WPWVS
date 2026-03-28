from typing import Optional, List
from pydantic import BaseModel

class Token(BaseModel):
    """
    登入成功後回傳給前端的 Token 資訊
    """
    access_token: str
    token_type: str = "bearer"
    user_id: int


class TokenPayload(BaseModel):
    """
    解析 JWT Token 後內部的資料格式 (Payload)
    通常用來確認 Token 裡面的使用者 ID (sub) 是否存在
    """
    sub: Optional[int] = None