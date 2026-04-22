# Bike AI Dashboard - Progressing Log

## 目前狀態 (Status)
🟢 準備進行 (Ready for next step)
目前準備進行 [Step 2] 前端上傳介面。

## 已完成 (Done)
- [x] **[Step 0] 環境與同步初始化:** 建立 `requirements.txt`，初始化 Git，建立 `.gitignore` 與 `progressing.md` 初版。
- [x] **[Step 1] 後端基礎骨架:** 撰寫 `main.py` 啟動 FastAPI 伺服器，確保 `localhost:8000` 正常運作。

## 待辦 (Pending)
- [ ] **[Step 2] 前端上傳介面:** 建立 HTML 介面 (上傳按鈕、圖表區、文字反饋區)，並綁定 API 路由。
- [ ] **[Step 3] 核心資料演算法:** 實作 .fit 檔解析，完成隱私過濾、行為標籤 (`Stopped`/`Coasting`/`Active`) 與高階指標計算。
- [ ] **[Step 4] 分色圖表實作:** 使用 Plotly 畫出帶有紅/藍背景標記的趨勢圖，並準備好圖片匯出功能。
- [ ] **[Step 5] 串接 Gemini API:** 整合教練提示詞與圖文資料，呼叫 API 並將分析結果顯示於前端儀表板。

## 給下一個 AI 的上下文重點 (Context)
- 已完成 **[Step 1]**，建立了 FastAPI 基礎骨架 (`main.py`)，提供 `/` 測試路由。
- **接下來請接手 [Step 2]:** 建立前端的 HTML 介面 (建議建立 `static/` 或 `templates/` 目錄)，並實作提供前端介面與檔案上傳的 API 路由。
