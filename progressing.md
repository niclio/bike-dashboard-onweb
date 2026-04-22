# Bike AI Dashboard - Progressing Log

## 目前狀態 (Status)
🟢 準備進行 (Ready for next step)
目前準備進行 [Step 5] 串接 Gemini API。

## 已完成 (Done)
- [x] **[Step 0] 環境與同步初始化:** 建立 `requirements.txt`，初始化 Git，建立 `.gitignore` 與 `progressing.md`。
- [x] **[Step 1] 後端基礎骨架:** 撰寫 `main.py` 啟動 FastAPI 伺服器，確保 `localhost:8000` 正常運作。
- [x] **[Step 2] 前端上傳介面:** 建立 HTML 介面，並綁定 API 路由 `/api/upload-fit`。
- [x] **[Step 3] 核心資料演算法:** 實作 `utils/fit_processor.py` (包含隱私過濾、Auto-pause 對齊、高階指標計算)，並與後端 API 整合。
- [x] **[Step 4] 分色圖表與軌跡實作:** 在前端 `static/app.js` 中實作了四大指標卡片、Plotly Mapbox 深色地圖軌跡，以及 Plotly 雙 Y 軸折線圖，並成功加入代表 Coasting (藍色) 與 Stopped (紅色) 的底色區塊。

## 待辦 (Pending)
- [ ] **[Step 5] 串接 Gemini API:** 整合教練提示詞與圖文資料，呼叫 API 並將分析結果顯示於前端儀表板。

## 給下一個 AI 的上下文重點 (Context)
- 已完成 **[Step 4]**，前端已經可以完美繪製並展示使用者上傳的 `.fit` 解析結果，包含深色地圖與分色背景的折線圖。
- 只要前端完成 `Plotly.newPlot` 的繪製，就會將包含高階指標的卡片與兩大圖表呈現在畫面中。
- **接下來請接手 [Step 5]:**
  - 在後端利用 `google-generativeai` 套件，在使用者上傳檔案並解析完成後，除了圖表資料外，也將整理好的 `metrics` 以 Prompt 形式餵給 Gemini 1.5。
  - 設計一段專業的 System Prompt，要求模型扮演教練，針對「滑行比例」、「NP」、「停等次數與休息」進行解讀與建議。
  - 提供新的 API 路由或修改目前的上傳路由，將 Gemini 回應結果傳遞給前端，並渲染在 `ai-feedback` 區塊中。
