# Render 與 Firebase 部署指南 (Phase 2)

這份指南將協助您完成後端部署與前後端串接的最後步驟。請在有空時逐步完成。

## 步驟 1：取得 Firebase 服務帳戶金鑰 (Service Account Key)

由於我們的 FastAPI 後端需要在背景獨立讀寫 Firebase，我們必須給予它專屬的權限。

1. 進入 [Firebase Console](https://console.firebase.google.com/)。
2. 點擊左上角的齒輪圖示 ⚙️，選擇 **「專案設定」(Project settings)**。
3. 切換到 **「服務帳戶」(Service accounts)** 標籤頁。
4. 點擊 **「產生新的私密金鑰」(Generate new private key)**。
5. 這會下載一個 `.json` 檔案。**請務必妥善保存此檔案，千萬不要將它推送到 GitHub 上！**

## 步驟 2：將後端部署至 Render

1. 登入 [Render](https://render.com/)，點擊 **New +** 並選擇 **Web Service**。
2. 連結這個 GitHub 儲存庫 (`niclio/bike-dashboard-onweb`)。
3. 設定以下環境：
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. 進入 **Environment Variables (環境變數)** 設定：
   - 新增 `GEMINI_API_KEY`，填入您的 Gemini API 金鑰。
5. **設定 Firebase 憑證 (關鍵步驟)**：
   - 由於 Render 無法直接上傳剛才下載的 JSON 檔案，請在 Render 選擇 **Secret Files** 功能。
   - File Name 填寫：`firebase-credentials.json`
   - File Content 貼上：剛才下載的 `.json` 檔案裡面的所有內容。
   - 儲存後，回到 Environment Variables，新增一個變數 `GOOGLE_APPLICATION_CREDENTIALS`，值填入 `/etc/secrets/firebase-credentials.json`。
6. 點擊 Deploy 等待部署完成，並複製 Render 分配給您的網址 (例如 `https://bike-dashboard-api.onrender.com`)。

## 步驟 3：更新前端設定並發布

1. 打開本地端的 `frontend/app.js`。
2. 找到大約第 19 行的 `API_BASE_URL`：
   ```javascript
   // 原本是：
   const API_BASE_URL = 'http://127.0.0.1:8000';
   
   // 請改成您在 Render 拿到的網址 (結尾不要有斜線)：
   const API_BASE_URL = 'https://bike-dashboard-api.onrender.com';
   ```
3. 儲存檔案，然後將更改推送到 GitHub：
   ```bash
   git add frontend/app.js
   git commit -m "chore: update API_BASE_URL for production"
   git push origin main
   ```
4. GitHub 的更新會自動觸發 Vercel 重新部署您的前端。

## 步驟 4：最終測試

1. 打開您的 Vercel 網址。
2. 使用 Google 登入。
3. 上傳一個 `.fit` 檔案。
4. 觀察介面是否能正確顯示狀態變化 (Uploading -> Processing -> Completed)，並成功顯示圖表與 AI 教練反饋！

完成這些步驟後，您的多人網頁版儀表板就正式上線了！等您測試成功後，我們再來進行最後的「任務 4：AI 記憶功能」。祝上課順利！
