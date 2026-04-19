from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import date, datetime

class FileBase(BaseModel):
    name: str
    path: str
    type_id: int
    parent_id: Optional[int] = None
    duration: Optional[int] = None

class FileCreate(FileBase):
    pass

class File(FileBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class FolderResponse(BaseModel):
    folder: File
    children: List[File]