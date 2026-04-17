from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import date, datetime

from app.schemas import User, File

class FavoriteBase(BaseModel):
    user_id: int
    file_id: int

class FavoriteCreate(FavoriteBase):
    pass

class FavoriteRemove(FavoriteBase):
    pass

class Favorite(FavoriteBase):
    created_at: datetime
    user: User
    file: File

    model_config = ConfigDict(from_attributes=True)