document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const statusMsg = document.getElementById('upload-status');
    
    const placeholder = document.getElementById('chart-placeholder');
    const dashboardContent = document.getElementById('dashboard-content');

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
        handleFiles(dt.files);
    }

    function handleFileSelect(e) {
        handleFiles(e.target.files);
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
                showStatus('資料解析完成！正在繪製圖表...', 'success');
                renderDashboard(result.data);
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

    function renderDashboard(data) {
        const { metrics, plot_data } = data;

        // Display the dashboard layout
        placeholder.style.display = 'none';
        dashboardContent.style.display = 'block';

        // 1. Update Metrics Summary Cards
        document.getElementById('val-np').textContent = `${metrics.normalized_power} W`;
        document.getElementById('val-dist').textContent = `${metrics.total_distance_km} km`;
        document.getElementById('val-stops').textContent = `${metrics.stop_count}`;
        document.getElementById('val-coast').textContent = `${(metrics.coasting_time_ratio * 100).toFixed(1)} %`;

        // 2. Render Mapbox
        const lats = plot_data.position_lat.filter(val => val !== null);
        const lons = plot_data.position_long.filter(val => val !== null);
        
        if (lats.length > 0 && lons.length > 0) {
            const mapTrace = {
                type: 'scattermapbox',
                mode: 'lines',
                lat: lats,
                lon: lons,
                line: { width: 4, color: '#3b82f6' },
                name: '騎乘軌跡'
            };

            const mapLayout = {
                mapbox: {
                    style: 'carto-darkmatter', // Dark mode map
                    center: { lat: lats[Math.floor(lats.length/2)], lon: lons[Math.floor(lons.length/2)] },
                    zoom: 11
                },
                margin: { l: 0, r: 0, t: 0, b: 0 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
            };

            Plotly.newPlot('map-container', [mapTrace], mapLayout, {displayModeBar: false});
        } else {
            document.getElementById('map-container').innerHTML = '<p style="text-align:center; padding-top: 180px; color: var(--text-secondary);">無法繪製軌跡 (無有效 GPS 數據)</p>';
        }

        // 3. Render Trend Chart with Background Colors
        const trendTraces = [
            {
                x: plot_data.timestamp,
                y: plot_data.power,
                name: '功率 (W)',
                type: 'scatter',
                mode: 'lines',
                line: {color: '#f59e0b', width: 1}, // Amber
                yaxis: 'y1'
            },
            {
                x: plot_data.timestamp,
                y: plot_data.heart_rate,
                name: '心率 (bpm)',
                type: 'scatter',
                mode: 'lines',
                line: {color: '#ef4444', width: 1.5}, // Red
                yaxis: 'y2'
            }
        ];

        // Create Background Shapes for Coasting and Stopped
        const shapes = [];
        let currentState = 'Active';
        let startIdx = 0;

        for (let i = 0; i < plot_data.behavior_state.length; i++) {
            const state = plot_data.behavior_state[i];
            if (state !== currentState) {
                if (currentState === 'Stopped' || currentState === 'Coasting') {
                    shapes.push({
                        type: 'rect',
                        xref: 'x',
                        yref: 'paper',
                        x0: plot_data.timestamp[startIdx],
                        x1: plot_data.timestamp[i],
                        y0: 0,
                        y1: 1,
                        fillcolor: currentState === 'Stopped' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        line: {width: 0},
                        layer: 'below'
                    });
                }
                currentState = state;
                startIdx = i;
            }
        }
        
        if (currentState === 'Stopped' || currentState === 'Coasting') {
            shapes.push({
                type: 'rect',
                xref: 'x',
                yref: 'paper',
                x0: plot_data.timestamp[startIdx],
                x1: plot_data.timestamp[plot_data.timestamp.length - 1],
                y0: 0,
                y1: 1,
                fillcolor: currentState === 'Stopped' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                line: {width: 0},
                layer: 'below'
            });
        }

        const trendLayout = {
            title: { text: '功率與心率趨勢 (紅色: 停等, 藍色: 滑行)', font: {color: '#f8fafc', size: 14} },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#94a3b8' },
            xaxis: { showgrid: false },
            yaxis: { title: '功率 (W)', showgrid: true, gridcolor: 'rgba(255,255,255,0.05)' },
            yaxis2: { title: '心率 (bpm)', overlaying: 'y', side: 'right', showgrid: false },
            shapes: shapes,
            margin: { l: 50, r: 50, t: 50, b: 50 },
            legend: { orientation: 'h', y: 1.1 }
        };

        Plotly.newPlot('trend-chart-container', trendTraces, trendLayout, {responsive: true});
        showStatus('圖表繪製完成！', 'success');
    }
});
