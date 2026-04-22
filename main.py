from fastapi import FastAPI
import uvicorn

app = FastAPI(
    title="Bike AI Dashboard",
    description="Backend API for Bike AI Dashboard",
    version="0.1.0"
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Bike AI Dashboard API. The server is running."}

if __name__ == "__main__":
    # 使用 uvicorn 啟動伺服器，並開啟 reload 模式方便開發
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
