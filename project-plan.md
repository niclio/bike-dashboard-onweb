# 🚴‍♂️ Bike AI Dashboard (單車 AI 儀表板) - 終極開發計畫 (Master Plan)

## 📌 1. 專案概述與願景 (Project Overview)
本專案為一個運行於本機端 (Localhost) 的單車騎乘數據分析平台。
系統將讀取 Wahoo 車錶產出的 `.fit` 檔案，透過高階資料工程（過濾紅綠燈雜訊、識別滑行休息），結合互動式圖表，最終利用 Google Gemini 多模態 API 提供專業的教練級訓練反饋。
**特別要求：** 本專案強調「跨環境開發與狀態傳承」，需嚴格執行 Git 版本控制與維護 AI 接力文件。

---

## 🛠 2. 技術棧 (Tech Stack)
* **後端架構:** `FastAPI` + `uvicorn` (Python)
* **資料工程:** `fitparse` (解析 .fit), `pandas`, `numpy` (時間序列處理與行為識別)
* **視覺化:** `plotly` (產生前端互動圖表與後端暫存圖片)
* **AI 串接:** `google-generativeai` (Gemini 1.5 視覺分析)
* **前端介面:** 簡易 HTML/JS (透過 FastAPI 渲染)

---

## 🧠 3. 核心資料工程與演算法 (Data Engineering & Behavior Logic)
請 Agent 實作資料處理腳本（建議建立於 `utils/fit_processor.py`），包含以下邏輯：

### A. 隱私過濾 (Privacy Masking)
自動偵測並移除住家附近（如：台南安南區）的 GPS 座標，僅保留用於分析的運動表現數據（心率、功率、迴轉速、高度）。

### B. 騎乘行為識別標籤 (Behavior Labeling)
利用速度 (Speed)、功率 (Power)、迴轉速 (Cadence) 為每一秒的數據標註 `behavior_state`：
1. **`Stopped` (停等紅綠燈):** 速度 < 0.8 m/s。
2. **`Coasting` (滑行休息):** 速度 >= 0.8 m/s 且 功率 == 0 且 迴轉速 == 0。
3. **`Active` (主動踩踏):** 排除上述兩者的正常輸出狀態。

### C. 高階指標計算 (Advanced Metrics)
* **標準化功率 (NP):** 對 `power` 進行 30 秒移動平均的四次方根計算。
* **時間對比:** 總經過時間 (Elapsed Time) vs. 實際移動時間 (Moving Time)。
* **干擾與恢復分析:** 計算停等總次數、滑行時間佔比、起步前 10 秒平均爆發功率，以及滑行/停等時的「心率下降趨勢（HR Recovery）」。

---

## 📊 4. 視覺化與 AI 整合 (Visualization & AI Coach)

### A. 視覺化圖表與軌跡地圖 (Plotly)
* **數據趨勢圖:** 繪製雙 Y 軸折線圖 (X軸: 時間, Y1: 功率, Y2: 心率)。
* **背景分色實作:** 利用 Plotly 將 `Stopped` (停等) 區段標示為淺紅色，`Coasting` (滑行) 區段標示為淺藍色。
* **軌跡地圖:** 繪製騎乘 GPS 軌跡地圖 (排除隱私過濾區段)，並顯示運動總距離 (長度)。

### B. Gemini 提示詞工程 (Prompt Engineering)
* **多模態輸入:** 結合「步驟 3C 的高階指標 (JSON)」與「步驟 4A 的分色圖表 (Image)」。
* **System Prompt 方向:** 指示 AI 教練忽略紅色區塊的均值干擾，觀察藍色/紅色區塊的心率恢復效率，並評估 NP 與起步消耗，給出專業訓練建議。

---

## 📝 5. AI 接力與版本控制 (AI Handover & Version Control)
為確保開發者回家後能無縫接軌，請 Agent **強制執行** 以下流程：

1. **維護 `progressing.md`:** 在專案根目錄建立此文件。每次完成一個 Step，需更新「目前狀態 (Status)」、「已完成 (Done)」、「待辦 (Pending)」與「給下一個 AI 的上下文重點 (Context)」。
2. **Git 同步:** * 初始化 `git init` 並建立 `.gitignore` (排除 `.venv`, `__pycache__`, API Key 等)。
   * 每次完成一個 Step，自動執行 `git add .` 與 `git commit -m "Step X: [功能簡述]"`。

---

## 🚀 6. 實作步驟拆解 (Implementation Steps)
請 Agent 嚴格依序執行，每完成一步請暫停、回報開發者，並 **更新 progressing.md 及 commit** 後再繼續：

* **[Step 0] 環境與同步初始化:** 建立 `requirements.txt`，初始化 Git，建立 `progressing.md` 初版。
* **[Step 1] 後端基礎骨架:** 撰寫 `main.py` 啟動 FastAPI 伺服器，確保 `localhost:8000` 正常運作。
* **[Step 2] 前端上傳介面:** 建立 HTML 介面 (上傳按鈕、圖表區、文字反饋區)，並綁定 API 路由。
* **[Step 3] 核心資料演算法:** 實作 .fit 檔解析，完成 Section 3 規範的隱私過濾、行為標籤 (`Stopped`/`Coasting`/`Active`) 與高階指標計算。
* **[Step 4] 分色圖表實作:** 使用 Plotly 畫出帶有紅/藍背景標記的趨勢圖，並準備好圖片匯出功能。
* **[Step 5] 串接 Gemini API:** 整合教練提示詞與圖文資料，呼叫 API 並將分析結果顯示於前端儀表板。