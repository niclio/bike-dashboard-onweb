document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const statusMsg = document.getElementById('upload-status');

    // Drag & Drop Handlers
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
    });

    dropZone.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', handleFileSelect, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (file.name.toLowerCase().endsWith('.fit')) {
                uploadFile(file);
            } else {
                showStatus('請上傳 .fit 格式的檔案', 'error');
            }
        }
    }

    async function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        showStatus(`上傳中: ${file.name}...`, '');
        
        // Add loading state to button
        const btn = document.querySelector('.btn-primary');
        const originalText = btn.textContent;
        btn.textContent = '處理中...';
        btn.disabled = true;

        try {
            const response = await fetch('/api/upload-fit', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                showStatus(result.message || '上傳成功！準備進行解析...', 'success');
                console.log("Server response:", result);
                // TODO: Step 3 & 4 將會在此處處理回傳的圖表與數據，更新到介面上
            } else {
                showStatus(result.detail || '上傳失敗', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showStatus('發生網路錯誤，無法連接至伺服器', 'error');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }

    function showStatus(message, type) {
        statusMsg.textContent = message;
        statusMsg.className = 'status-message';
        if (type === 'error') statusMsg.classList.add('status-error');
        if (type === 'success') statusMsg.classList.add('status-success');
    }
});
