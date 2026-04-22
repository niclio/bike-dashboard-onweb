# Bike AI Dashboard - Progressing Log

## 目前狀態 (Status)
🟢 準備進行 (Ready for next step)
目前準備進行 [Step 3] 核心資料演算法。

## 已完成 (Done)
- [x] **[Step 0] 環境與同步初始化:** 建立 `requirements.txt`，初始化 Git，建立 `.gitignore` 與 `progressing.md`。
- [x] **[Step 1] 後端基礎骨架:** 撰寫 `main.py` 啟動 FastAPI 伺服器，確保 `localhost:8000` 正常運作。
- [x] **[Step 2] 前端上傳介面:** 建立 HTML 介面 (上傳按鈕、圖表區、文字反饋區)，並綁定 API 路由 `/api/upload-fit`。引入了具備現代感 (Glassmorphism, Dark mode) 的前端美學。

## 待辦 (Pending)
- [ ] **[Step 3] 核心資料演算法:** 實作 `.fit` 檔解析，完成隱私過濾、行為標籤 (`Stopped`/`Coasting`/`Active`) 與高階指標計算。
- [ ] **[Step 4] 分色圖表實作:** 使用 Plotly 畫出帶有紅/藍背景標記的趨勢圖，並準備好圖片匯出功能。
- [ ] **[Step 5] 串接 Gemini API:** 整合教練提示詞與圖文資料，呼叫 API 並將分析結果顯示於前端儀表板。

## 給下一個 AI 的上下文重點 (Context)
- 已完成 **[Step 2]**，前端介面位於 `static/` 資料夾，具備現代 UI 質感與拖曳上傳功能。後端 `main.py` 新增了 `POST /api/upload-fit` 接收檔案的路由，並掛載了 StaticFiles 來渲染網頁。
- 若伺服器運作中，可以直接前往 `http://127.0.0.1:8000` 檢視介面。
- **接下來請接手 [Step 3]:** 請建立 `utils/fit_processor.py`，實作處理 `.fit` 檔案的資料工程邏輯，包含隱私過濾、行為識別 (`Stopped`, `Coasting`, `Active`)、計算 NP (標準化功率) 與其他指標，並將這些邏輯串接到 `main.py` 的 `/api/upload-fit` 路由中。
