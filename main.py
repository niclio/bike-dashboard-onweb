import os
import traceback
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import google.generativeai as genai
from dotenv import load_dotenv

import firebase_admin
from firebase_admin import credentials, firestore, storage as fb_storage

from utils.fit_processor import FitProcessor

# 載入環境變數
load_dotenv()

# 初始化 Firebase Admin SDK
# 注意：在正式環境中 (如 Render)，您需要設定 GOOGLE_APPLICATION_CREDENTIALS 環境變數
# 指向您的 Firebase Service Account JSON 檔案
try:
    if not firebase_admin._apps:
        if os.path.exists("firebase-admin.json"):
            cred = credentials.Certificate("firebase-admin.json")
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()
    db = firestore.client()
    bucket = fb_storage.bucket('bike-dashboard-onweb.firebasestorage.app')
except Exception as e:
    print(f"Firebase Admin SDK 初始化失敗: {e}")

app = FastAPI(
    title="Bike AI Dashboard API",
    description="Async Backend API for Bike AI Dashboard",
    version="0.2.0"
)

# 設定 CORS (允許所有來源，方便前端 Vercel 呼叫)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 正式上線建議改為您的 Vercel 網域
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 確保暫存目錄存在
os.makedirs("temp", exist_ok=True)

class ProcessRideRequest(BaseModel):
    rideId: str
    userId: str

@app.get("/api/ping")
async def ping():
    """用於喚醒 Render 伺服器 (Cold Start)"""
    return {"status": "ok", "message": "Server is awake"}

def process_ride_background(ride_id: str, user_id: str):
    """背景處理任務：下載、解析、AI 分析、回寫 Firestore"""
    print(f"開始背景處理 Ride: {ride_id} (User: {user_id})")
    try:
        # 1. 從 Firebase Storage 下載 .fit 檔案
        blob_path = f"rides/{user_id}/{ride_id}.fit"
        blob = bucket.blob(blob_path)
        
        temp_file_path = os.path.join("temp", f"{ride_id}.fit")
        blob.download_to_filename(temp_file_path)
        print("檔案下載完成")

        # 2. 解析 .fit 檔案
        processor = FitProcessor()
        result = processor.process_file(temp_file_path)
        print("資料解析完成")

        # 3. 呼叫 Gemini 進行 AI 分析
        ai_feedback = get_ai_feedback(result['metrics'])
        print("AI 分析完成")

        # 4. 更新 Firestore
        doc_ref = db.collection('rides').document(ride_id)
        doc_ref.update({
            'status': 'completed',
            'result': result,
            'ai_feedback': ai_feedback
        })
        print("Firestore 更新完成！")

    except Exception as e:
        print(f"背景處理發生錯誤: {e}")
        traceback.print_exc()
        try:
            doc_ref = db.collection('rides').document(ride_id)
            doc_ref.update({
                'status': 'error',
                'error': str(e)
            })
        except Exception as inner_e:
            print(f"更新錯誤狀態失敗: {inner_e}")
    finally:
        # 清理暫存檔
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

def get_ai_feedback(metrics: dict) -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        return "伺服器未設定 GEMINI_API_KEY，無法提供 AI 分析。"

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash') 
        
        prompt = f"""
        你是一位世界級專業單車教練。使用者剛完成了一趟騎乘。請根據以下分析指標，針對這趟騎乘給出 3-5 點具體的訓練反饋。
        
        【本趟騎乘高階指標】
        - 標準化功率 (NP): {metrics.get('normalized_power')} W
        - 總距離: {metrics.get('total_distance_km')} km
        - 總移動時間: {metrics.get('moving_time_s')} 秒
        - 停等次數: {metrics.get('stop_count')} 次
        - 滑行時間佔比: {metrics.get('coasting_time_ratio')} (滑行表示速度大於0但踏頻與功率為0)
        - 爆發功率(起步前10秒平均): {metrics.get('avg_burst_power_10s')} W

        請重點分析：
        1. 停等或滑行後的爆發功率是否恰當，或是否消耗過多體力。
        2. 針對上述指標，提供未來訓練或配速的調整方向。
        
        語氣請專業、客觀且具備激勵性。輸出請直接使用 Markdown 格式排版，不需加上額外的開頭語，重點可以粗體標示。
        """

        response = model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        print(f"AI 教練分析失敗: {e}")
        traceback.print_exc()
        return f"AI 教練分析失敗: {str(e)}"

@app.post("/api/process-ride")
async def process_ride(request: ProcessRideRequest, background_tasks: BackgroundTasks):
    """接收前端觸發，將處理任務丟到背景，立即回傳 202"""
    background_tasks.add_task(process_ride_background, request.rideId, request.userId)
    return {"status": "accepted", "message": "Processing started in background"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
