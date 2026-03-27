from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
from typing import List, Optional

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MUSIC_DIR = os.path.join(os.path.dirname(__file__), "music")
ALLOWED_EXTENSIONS = {".mp3", ".wav", ".flac", ".m4a", ".aac", ".ogg", ".mp4", ".mkv", ".webm"}

@app.get("/")
def read_root():
    return {"status": "ok", "message": "PlayerWeb Backend is running"}

@app.get("/songs")
def list_songs(path: str = ""):
    # 這裡的 path 是相對於 MUSIC_DIR 的路徑
    target_dir = os.path.join(MUSIC_DIR, path)
    
    # 安全檢查：確保路徑在 MUSIC_DIR 內
    real_music_dir = os.path.realpath(MUSIC_DIR)
    real_target_dir = os.path.realpath(target_dir)
    if not real_target_dir.startswith(real_music_dir):
        raise HTTPException(status_code=403, detail="Forbidden")

    if not os.path.exists(target_dir):
        return {"files": [], "folders": [], "path": path}
    
    files = []
    folders = []
    
    try:
        for item in os.listdir(target_dir):
            full_path = os.path.join(target_dir, item)
            if os.path.isdir(full_path):
                folders.append(item)
            elif any(item.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS):
                files.append(item)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    return {
        "files": sorted(files),
        "folders": sorted(folders),
        "path": path
    }

@app.get("/stream/{path:path}")
async def stream_song(path: str):
    file_path = os.path.join(MUSIC_DIR, path)
    
    real_music_dir = os.path.realpath(MUSIC_DIR)
    real_file_path = os.path.realpath(file_path)
    if not real_file_path.startswith(real_music_dir):
         raise HTTPException(status_code=403, detail="Forbidden")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path)

@app.get("/captions/{path:path}")
async def get_captions(path: str):
    # 移除副檔名並加上 .vtt
    base_path, _ = os.path.splitext(path)
    vtt_path = base_path + ".vtt"
    file_path = os.path.join(MUSIC_DIR, vtt_path)
    
    real_music_dir = os.path.realpath(MUSIC_DIR)
    real_file_path = os.path.realpath(file_path)
    if not real_file_path.startswith(real_music_dir):
         raise HTTPException(status_code=403, detail="Forbidden")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Caption not found")
    
    return FileResponse(file_path, media_type="text/vtt")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
