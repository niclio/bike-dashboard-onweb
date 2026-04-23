import os
import shutil
import base64
from fastapi import FastAPI, UploadFile, File

from pydantic import BaseModel
import uvicorn
import google.generativeai as genai
from dotenv import load_dotenv

from utils.fit_processor import FitProcessor

# 載入環境變數
load_dotenv()

app = FastAPI(
    title="Bike AI Dashboard",
    description="Backend API for Bike AI Dashboard",
    version="0.1.0"
)

# 確保目錄存在
os.makedirs("temp", exist_ok=True)

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

class CoachRequest(BaseModel):
    metrics: dict
    chart_image_base64: str

@app.post("/api/analyze-coach")
async def analyze_coach(request: CoachRequest):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        return {"status": "error", "detail": "伺服器未設定 GEMINI_API_KEY，請在 .env 檔案中設定您的金鑰。"}

    try:
        genai.configure(api_key=api_key)
        
        # 提取 base64 image data
        b64_data = request.chart_image_base64
        if "," in b64_data:
            b64_data = b64_data.split(",")[1]
            
        image_bytes = base64.b64decode(b64_data)
        image_part = {
            "mime_type": "image/png",
            "data": image_bytes
        }

        # 使用支援多模態與快速推論的最新 Gemini 2.5 Flash 模型
        model = genai.GenerativeModel('gemini-2.5-flash') 
        
        prompt = f"""
        你是一位世界級專業單車教練。使用者剛完成了一趟騎乘。請根據以下分析指標與附上的趨勢圖，針對這趟騎乘給出 3-5 點具體的訓練反饋。
        
        【本趟騎乘高階指標】
        - 標準化功率 (NP): {request.metrics.get('normalized_power')} W
        - 總距離: {request.metrics.get('total_distance_km')} km
        - 總移動時間: {request.metrics.get('moving_time_s')} 秒
        - 停等次數: {request.metrics.get('stop_count')} 次
        - 滑行時間佔比: {request.metrics.get('coasting_time_ratio')} (滑行表示速度大於0但踏頻與功率為0)
        - 爆發功率(起步前10秒平均): {request.metrics.get('avg_burst_power_10s')} W

        請重點分析：
        1. 輸出功率與心率的變化趨勢是否匹配 (從圖表中判斷心率漂移/疲勞)。
        2. 停等或滑行後的爆發功率是否恰當，或是否消耗過多體力。
        3. 針對上述指標，提供未來訓練或配速的調整方向。
        
        語氣請專業、客觀且具備激勵性。輸出請直接使用 Markdown 格式排版，不需加上額外的開頭語，重點可以粗體標示。
        """

        response = model.generate_content([prompt, image_part])
        return {"status": "success", "feedback": response.text}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "detail": f"AI 教練分析失敗: {str(e)}"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
