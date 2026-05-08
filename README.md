# Bike Dashboard OnWeb

## 🚀 目前專案狀態
本專案為單車 AI 儀表板，支援 `.fit` 檔案解析、地圖軌跡、數據圖表以及 Gemini AI 教練分析。
- **程式碼更新**：最近已完成 `main.py` 的相關修改與功能調整。
- **安全性更新**：為了避免 Firebase 金鑰外洩，已將 `firebase-admin.json` 加入 `.gitignore` 中。

---

## 💻 換電腦開發環境設定步驟 (Environment Setup)

當你在新電腦上準備繼續開發時，請依照以下步驟進行：

### 1. 取得最新程式碼
根據新電腦的情況，選擇其中一個指令來取得程式碼：
- **如果新電腦還沒有專案**：
  ```bash
  git clone https://github.com/niclio/bike-dashboard-onweb.git
  cd bike-dashboard-onweb
  ```
- **如果新電腦已經有舊版專案**：
  ```bash
  git pull origin main
  ```

### 2. 轉移 Firebase 金鑰 (重要 ⚠️)
因為金鑰為了資安**沒有**上傳到 GitHub，你需要手動將 `firebase-admin.json` 帶過去：
- 透過安全的管道（例如 Google Drive、OneDrive、隨身碟等）將原電腦的檔案傳送過去。
- 把 `firebase-admin.json` 放到新電腦專案的「**根目錄**」下。

### 3. 設定 Python 環境
為了確保執行順利，記得重新建立虛擬環境與安裝相關套件：
```bash
# 建立虛擬環境 (建議)
python -m venv .venv

# 啟動虛擬環境 (Windows)
.venv\Scripts\activate

# 安裝依賴套件
pip install -r requirements.txt
```

### 4. 測試執行
確認程式碼與金鑰就位後，即可啟動後端伺服器測試：
```bash
python main.py
```
若能正常啟動並連上資料庫，代表環境設定成功！
