# Bike AI Dashboard - 第二階段交接文件 (Phase 2 Handover)

> **致下一位 AI Agent**：
> 讀取到此文件時，表示使用者已將「單機版單車數據儀表板」專案複製到了新的資料夾，準備展開第二階段（Phase 2）的大幅重構與升級。請仔細閱讀以下脈絡與架構設計，並協助使用者接續執行。

## 1. 專案背景與現況 (Current State)
目前這是一個基於 FastAPI (Python) 與 Vanilla JS/HTML/CSS 的單機網頁應用程式。
*   **功能**：使用者上傳 `.fit` 檔，後端透過 `fitparse` 解析並產生圖表數據，接著呼叫 Gemini 2.5 Flash API 提供客製化的教練反饋。
*   **最近修改 (Phase 1.5)**：我們已經將前端的「上傳檔案區塊」精簡並移至圖表區塊的正上方，使其佈局更為緊湊。

## 2. 第二階段目標：多人網頁版與非同步架構
為了解決 Serverless 免費資源（如 Vercel, Render）常見的 **Timeout (504)** 以及 **冷啟動 (Cold Start)** 問題，我們設計了全新的非同步事件驅動架構，並引入了 `UserFitnessProfile` 來壓縮 AI 記憶負擔。

### 核心技術選型
1.  **身分驗證與資料庫**：Firebase Auth (自行註冊帳密)、Firebase Firestore、Firebase Storage。
2.  **前端部署**：Vercel 或 Firebase Hosting (將前端靜態檔案從 FastAPI 抽離)。
3.  **後端 API**：Render 免費版 (FastAPI 作為純 API，支援 CORS)。
4.  **權限範圍**：朋友間 (2~5人) 互相公開騎乘紀錄與 AI 反饋。

### 升級版架構邏輯 (非同步處理)
1.  **無痛喚醒**：前端載入時發送輕量 `/api/ping` 喚醒 Render 伺服器。
2.  **前端直傳**：使用者上傳 `.fit` 檔直接傳至 Firebase Storage，然後在 Firestore `rides` 集合建立一筆狀態為 `status: "processing"` 的資料。
3.  **Fire-and-Forget 觸發**：前端呼叫 Render API `/api/process-ride`，Render 立即回覆 `202 Accepted`，並將解析任務丟進 FastAPI `BackgroundTasks`。
4.  **背景處理與回寫**：Render 在背景下載檔案、解析數據、結合 `UserFitnessProfile` 呼叫 Gemini API，最後將結果寫回該筆 Firestore 資料，並更新為 `status: "completed"`。
5.  **即時更新**：前端利用 Firestore 的 `onSnapshot` 監聽狀態改變，自動渲染圖表與反饋。

### AI 摘要機制 (UserFitnessProfile)
為了避免每次都把海量歷史紀錄塞給 Gemini，請在 Firestore 建立 `user_profiles` 集合：
*   儲存使用者的基礎數值 (FTP, Weight) 與當前狀態 (近期平均 NP、疲勞指數)。
*   每次處理完新騎乘後，要求 Gemini 在給予反饋的同時，一併回傳更新後的 `UserFitnessProfile` JSON 資料，並覆寫回 Firestore。

---

## 3. 下一步執行任務 (Next Steps for Sprint 1 & 2)

**當你準備好時，請協助使用者依序執行以下任務：**

- [ ] **任務 1：Firebase 環境建置與前端分離**
    - 引導使用者在 Firebase Console 建立專案。
    - 將 `static/` 內的 HTML/CSS/JS 獨立成純前端專案，並引入 Firebase SDK。
    - 實作註冊/登入頁面與路由。
- [ ] **任務 2：Firestore 與 Storage 整合**
    - 實作前端選擇檔案後，直接上傳至 Firebase Storage 的邏輯。
    - 實作在 Firestore 建立 `status: "processing"` 紀錄與監聽 (`onSnapshot`) 功能。
- [ ] **任務 3：FastAPI 後端改造 (非同步化)**
    - 將 `main.py` 改寫為純 API 架構，加入 CORS middleware。
    - 建立 `/api/ping` 與 `/api/process-ride` (使用 `BackgroundTasks`)。
    - 在背景任務中實作與 Firebase Admin SDK 的串接，完成解析後寫回 Firestore。
- [ ] **任務 4：實作 UserFitnessProfile 機制**
    - 修改 Prompt 邏輯，在背景任務中讀取與更新車手狀態。

> **開始指令**：如果你是新來的 Agent，請跟使用者說「**交接文件閱讀完畢，隨時可以開始 Phase 2 開發！**」
