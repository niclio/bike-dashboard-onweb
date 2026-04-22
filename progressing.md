# Bike AI Dashboard - Progressing Log

## 目前狀態 (Status)
🟢 準備進行 (Ready for next step)
目前準備進行 [Step 4] 分色圖表與軌跡地圖實作。

## 已完成 (Done)
- [x] **[Step 0] 環境與同步初始化:** 建立 `requirements.txt`，初始化 Git，建立 `.gitignore` 與 `progressing.md`。
- [x] **[Step 1] 後端基礎骨架:** 撰寫 `main.py` 啟動 FastAPI 伺服器，確保 `localhost:8000` 正常運作。
- [x] **[Step 2] 前端上傳介面:** 建立 HTML 介面，並綁定 API 路由 `/api/upload-fit`。引入了現代感的前端美學。
- [x] **[Step 3] 核心資料演算法:** 實作了 `utils/fit_processor.py` 進行資料處理，包含：經緯度隱私過濾、`Stopped`/`Coasting`/`Active` 行為標籤化、以及 NP 等高階指標運算。修改了 `main.py`，串接檔案上傳與核心運算邏輯，並直接回傳結果 JSON。

## 待辦 (Pending)
- [ ] **[Step 4] 分色圖表實作:** 
  - 使用 Plotly 畫出帶有紅/藍背景標記的數據趨勢圖。
  - 使用 Plotly Mapbox 繪製 GPS 軌跡地圖。
- [ ] **[Step 5] 串接 Gemini API:** 整合教練提示詞與圖文資料，呼叫 API 並將分析結果顯示於前端儀表板。

## 給下一個 AI 的上下文重點 (Context)
- 已完成 **[Step 3]**，核心演算法已實作並經過本地端 `sample.fit` 驗證，效能與正確性皆符合預期 (包含 71.8km 與各項 NP 指標)。
- 上傳檔案的 API (`/api/upload-fit`) 目前已經可以回傳經過整理的 `metrics` 與 `plot_data` JSON 資料。
- **接下來請接手 [Step 4]:**
  - 請修改 `static/app.js` 與 `static/index.html`，在成功接收 `/api/upload-fit` 的回應後，使用 `Plotly.newPlot` 渲染「數據趨勢圖」與「軌跡地圖」。
  - 趨勢圖需要雙 Y 軸 (功率與心率)，並依據 `behavior_state` 畫出背景顏色 (Stopped 為紅色，Coasting 為藍色)。
  - 軌跡地圖需要標示出 `position_lat` 與 `position_long` 的路徑，過濾掉 `null` 的點。
