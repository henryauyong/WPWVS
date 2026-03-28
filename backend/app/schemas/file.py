from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import date, datetime

class FileBase(BaseModel):
    name: str
    path: str
    is_folder: bool
    parent_id: int

class FileCreate(FileBase):
    last_seen: datetime

class File(FileBase):
    id: str

    model_config = ConfigDict(from_attributes=True)