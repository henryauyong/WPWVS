from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import date, datetime

class UserBase(BaseModel):
    username: str
    role_id: int = 2

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    model_config = ConfigDict(from_attributes=True)