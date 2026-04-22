from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
import shutil
from utils.fit_processor import FitProcessor

app = FastAPI(
    title="Bike AI Dashboard",
    description="Backend API for Bike AI Dashboard",
    version="0.1.0"
)

# 確保目錄存在
os.makedirs("static", exist_ok=True)
os.makedirs("temp", exist_ok=True)

# 掛載靜態檔案目錄
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return FileResponse("static/index.html")

@app.post("/api/upload-fit")
async def upload_fit(file: UploadFile = File(...)):
    # 將上傳的檔案暫存至 temp 資料夾
    temp_file_path = os.path.join("temp", file.filename)
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # 使用 FitProcessor 進行核心資料解析與演算法計算
        processor = FitProcessor()
        result = processor.process_file(temp_file_path)
        
        return {
            "status": "success", 
            "filename": file.filename,
            "message": "檔案解析與核心運算完成！",
            "data": result
        }
    except Exception as e:
        return {
            "status": "error",
            "detail": f"處理檔案時發生錯誤: {str(e)}"
        }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
