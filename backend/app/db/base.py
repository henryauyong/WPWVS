from typing import Annotated, Optional
from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, declared_attr

# 定義通用型別
class Base(DeclarativeBase):
    @declared_attr.directive
    def __tablename__(cls) -> str:
        return cls.__name__.lower()

#定義常用型別 (BaseType)    
class BaseType:
    """
    所有模型的頂層基類。
    """
    int_pk = Annotated[int, mapped_column(Integer, primary_key=True, index=True, autoincrement=True)]

#包含 ID 的抽象基類
class BaseWithId(Base):
    __abstract__ = True
    id: Mapped[BaseType.int_pk]