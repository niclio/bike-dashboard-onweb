document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const statusMsg = document.getElementById('upload-status');
    
    const placeholder = document.getElementById('chart-placeholder');
    const dashboardContent = document.getElementById('dashboard-content');

    // Leaflet map instance
    let bikeMap = null;

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

        // 2. Render Leaflet Map
        renderLeafletMap(plot_data);

        // 3. Render Trend Chart with 4 metrics
        renderPlotlyTrendChart(plot_data);
    }

    function renderLeafletMap(plot_data) {
        // Reset map if it exists
        if (bikeMap) {
            bikeMap.remove();
        }

        const mapContainer = document.getElementById('map-container');
        
        // Filter out nulls but keep original index to fetch other metrics
        const validPoints = [];
        for(let i=0; i<plot_data.position_lat.length; i++) {
            if(plot_data.position_lat[i] !== null && plot_data.position_long[i] !== null) {
                validPoints.push({
                    lat: plot_data.position_lat[i], 
                    lng: plot_data.position_long[i], 
                    idx: i
                });
            }
        }

        if (validPoints.length === 0) {
            mapContainer.innerHTML = '<p style="text-align:center; padding-top: 180px; color: var(--text-secondary);">無法繪製軌跡 (無有效 GPS 數據)</p>';
            return;
        }

        const centerPt = validPoints[Math.floor(validPoints.length / 2)];
        bikeMap = L.map('map-container').setView([centerPt.lat, centerPt.lng], 13);

        // OpenStreetMap TileLayer (Light Street Style)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(bikeMap);

        const latlngs = validPoints.map(p => [p.lat, p.lng]);
        
        // Draw the main polyline
        const polyline = L.polyline(latlngs, {color: '#3b82f6', weight: 4, opacity: 0.8}).addTo(bikeMap);
        
        // Draw directional arrows using PolylineDecorator
        L.polylineDecorator(polyline, {
            patterns: [
                {
                    offset: 50, // Start after 50px
                    repeat: 100, // Arrow every 100px
                    symbol: L.Symbol.arrowHead({
                        pixelSize: 15, 
                        polygon: false, 
                        pathOptions: {stroke: true, color: '#1e3a8a', weight: 3, opacity: 0.8}
                    })
                }
            ]
        }).addTo(bikeMap);

        // Start / End Markers
        const startPt = validPoints[0];
        const endPt = validPoints[validPoints.length - 1];
        
        L.circleMarker([startPt.lat, startPt.lng], {radius: 8, color: '#10b981', fillColor: '#10b981', fillOpacity: 1}).addTo(bikeMap).bindTooltip("🟢 啟程", {permanent: true, direction: "top", offset: [0,-10]});
        L.circleMarker([endPt.lat, endPt.lng], {radius: 8, color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1}).addTo(bikeMap).bindTooltip("🏁 終點", {permanent: true, direction: "top", offset: [0,-10]});

        // Fit map bounds to the polyline
        bikeMap.fitBounds(polyline.getBounds());

        // Setup Hover Tooltip
        const infoMarker = L.circleMarker([0,0], {radius: 5, color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1, opacity: 1}).setOpacity(0);
        infoMarker.addTo(bikeMap);
        
        const tooltip = L.tooltip({direction: 'top', offset: [0, -10], className: 'custom-tooltip'});
        infoMarker.bindTooltip(tooltip);

        bikeMap.on('mousemove', function(e) {
            // Check if we are hovering near the polyline
            if(!polyline.getBounds().contains(e.latlng)) {
                hideTooltip();
                return;
            }

            // Find closest point
            let minDist = Infinity;
            let closestPt = null;
            const lat2 = e.latlng.lat;
            const lng2 = e.latlng.lng;
            
            // Subsampling for performance if needed, but 12k points is okay for linear scan
            for(let i=0; i<validPoints.length; i+=1) {
                const p = validPoints[i];
                const d = Math.pow(p.lat - lat2, 2) + Math.pow(p.lng - lng2, 2);
                if(d < minDist) {
                    minDist = d;
                    closestPt = p;
                }
            }

            // Threshold roughly equals to hovering over the line
            if(minDist < 0.00005) {
                infoMarker.setLatLng([closestPt.lat, closestPt.lng]);
                infoMarker.setOpacity(1);
                
                const idx = closestPt.idx;
                const spd = plot_data.speed[idx] !== null ? (plot_data.speed[idx] * 3.6).toFixed(1) : '--';
                const hr = plot_data.heart_rate[idx] !== null ? plot_data.heart_rate[idx] : '--';
                const pwr = plot_data.power[idx] !== null ? Math.round(plot_data.power[idx]) : '--';
                const cad = plot_data.cadence[idx] !== null ? Math.round(plot_data.cadence[idx]) : '--';
                
                tooltip.setContent(`
                    <div style="text-align:left; line-height: 1.4;">
                        <b style="color:#60a5fa">速度:</b> ${spd} km/h<br>
                        <b style="color:#ef4444">心率:</b> ${hr} bpm<br>
                        <b style="color:#f59e0b">功率:</b> ${pwr} W<br>
                        <b style="color:#10b981">踏頻:</b> ${cad} rpm
                    </div>
                `);
                infoMarker.openTooltip();
            } else {
                hideTooltip();
            }
        });

        function hideTooltip() {
            infoMarker.setOpacity(0);
            infoMarker.closeTooltip();
        }
    }

    function renderPlotlyTrendChart(plot_data) {
        // Prepare speed data (m/s to km/h)
        const speedKmh = plot_data.speed.map(s => s !== null ? s * 3.6 : null);

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
            },
            {
                x: plot_data.timestamp,
                y: plot_data.cadence,
                name: '踏頻 (rpm)',
                type: 'scatter',
                mode: 'lines',
                line: {color: '#10b981', width: 1}, // Emerald
                yaxis: 'y3',
                visible: 'legendonly' // 預設隱藏，點擊圖例開啟
            },
            {
                x: plot_data.timestamp,
                y: speedKmh,
                name: '速度 (km/h)',
                type: 'scatter',
                mode: 'lines',
                line: {color: '#3b82f6', width: 1}, // Blue
                yaxis: 'y4',
                visible: 'legendonly' // 預設隱藏，點擊圖例開啟
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
            title: { text: '騎乘趨勢分析 (點擊圖例可顯示速度/踏頻)', font: {color: '#f8fafc', size: 14} },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#94a3b8' },
            xaxis: { showgrid: false },
            yaxis: { title: '功率 (W)', showgrid: true, gridcolor: 'rgba(255,255,255,0.05)', rangemode: 'tozero' },
            yaxis2: { title: '心率 (bpm)', overlaying: 'y', side: 'right', showgrid: false, rangemode: 'tozero' },
            yaxis3: { overlaying: 'y', side: 'right', showticklabels: false, rangemode: 'tozero' }, // 隱藏座標軸文字，共用空間
            yaxis4: { overlaying: 'y', side: 'left', showticklabels: false, rangemode: 'tozero' },
            shapes: shapes,
            margin: { l: 50, r: 50, t: 50, b: 50 },
            legend: { orientation: 'h', y: 1.15 }
        };

        Plotly.newPlot('trend-chart-container', trendTraces, trendLayout, {responsive: true});
        showStatus('圖表與地圖繪製完成！', 'success');
    }
});
