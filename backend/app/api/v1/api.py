from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, files

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["User"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(files.router, prefix="/files", tags=["File"])