from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
import os

app = FastAPI(
    title="Bike AI Dashboard",
    description="Backend API for Bike AI Dashboard",
    version="0.1.0"
)

# 確保 static 目錄存在
os.makedirs("static", exist_ok=True)

# 掛載靜態檔案目錄 (這樣 /static 下的檔案就能被前端讀取，例如 CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    # 首頁直接回傳 static/index.html
    return FileResponse("static/index.html")

@app.post("/api/upload-fit")
async def upload_fit(file: UploadFile = File(...)):
    # 這裡先實作一個初步成功的回應，為 Step 3 準備
    # 未來這段會把上傳的檔案傳給 fit_processor 去解析
    return {
        "status": "success", 
        "filename": file.filename,
        "message": f"檔案 {file.filename} 上傳成功，等待進行資料解析..."
    }

if __name__ == "__main__":
    # 使用 uvicorn 啟動伺服器，並開啟 reload 模式方便開發
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
