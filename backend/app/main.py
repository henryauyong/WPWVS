from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import api
from app.deps import get_db
import os
from typing import List, Optional

app = FastAPI()
app.include_router(api.api_router)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/db-test")
def test_db(db: Session = Depends(get_db)):
    try:
        # 使用 sqlite_version() 可以確認 SQLite 引擎正常運作並回傳版本
        result = db.execute(text("SELECT sqlite_version();")).fetchone()
        
        return {
            "database_type": "SQLite",
            "version": result[0],
            "status": "connected"
        }
    except Exception as e:
        return {
            "status": "error", 
            "message": str(e)
        }
