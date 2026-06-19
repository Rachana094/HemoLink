/**
 * HemoLink Map — Geo-Spatial Routing Visualization (Canvas-based)
 */

async function renderMap(container) {
    destroyCharts();
    
    const network = await api.get('/api/analytics/routing/network');
    if (!network) return;

    // Create options for dropdown
    const optionsHTML = network.nodes.map(n => 
        `<option value="${n.lat}, ${n.lng}">${n.name.replace(/_/g, ' ').toUpperCase()}</option>`
    ).join('');

    container.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">🗺️ Geo-Spatial Routing Intelligence</div>
                <div class="section-subtitle">Dijkstra & A* pathfinding on Bangalore's road network with traffic optimization</div>
            </div>
        </div>

        <div class="content-grid">
            <div class="card-section glass-card" style="grid-column:1/-1;">
                <div class="card-section-title">🛤️ Route Network — Bangalore</div>
                <div class="map-canvas-container" style="min-height: 500px;">
                    <canvas id="map-canvas"></canvas>
                </div>
            </div>
        </div>

        <div class="content-grid">
            <div class="card-section glass-card">
                <div class="card-section-title">📍 Route Finder</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="route-origin-select">Origin Zone</label>
                        <select id="route-origin-select" class="form-select">
                            ${optionsHTML}
                        </select>
                        <input type="hidden" id="route-origin" value="12.9352, 77.6245">
                    </div>
                    <div class="form-group">
                        <label for="route-dest-select">Destination Zone</label>
                        <select id="route-dest-select" class="form-select">
                            ${optionsHTML}
                        </select>
                        <input type="hidden" id="route-dest" value="13.0358, 77.5970">
                    </div>
                </div>
                <button id="find-route" class="btn btn-primary btn-full" style="margin-top:16px;">🧭 Find Optimal Route</button>
                <div id="route-result" style="margin-top:16px;"></div>
            </div>
            <div class="card-section glass-card">
                <div class="card-section-title">📊 Network Statistics</div>
                <div id="network-stats"></div>
            </div>
        </div>
    `;

    // Draw network on canvas
    const canvas = document.getElementById('map-canvas');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width > 0 ? rect.width : (canvas.parentElement.clientWidth || 800);
    canvas.height = rect.height > 0 ? rect.height : 500;
    const ctx = canvas.getContext('2d');

    // Update coordinates when select updates
    const origSelect = document.getElementById('route-origin-select');
    const destSelect = document.getElementById('route-dest-select');
    const origInput = document.getElementById('route-origin');
    const destInput = document.getElementById('route-dest');

    // Set default selections
    origSelect.value = "12.9352, 77.6245"; // Koramangala
    destSelect.value = "13.0358, 77.5970"; // Hebbal

    origSelect.addEventListener('change', (e) => { origInput.value = e.target.value; });
    destSelect.addEventListener('change', (e) => { destInput.value = e.target.value; });

    function latLngToXY(lat, lng) {
        const minLat = 12.82, maxLat = 13.12, minLng = 77.49, maxLng = 77.78;
        const padding = 60;
        const x = padding + ((lng - minLng) / (maxLng - minLng)) * (canvas.width - 2 * padding);
        const y = padding + ((maxLat - lat) / (maxLat - minLat)) * (canvas.height - 2 * padding);
        return [x, y];
    }

    function drawNetwork(highlightPath = null) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background grid
        ctx.strokeStyle = 'rgba(255,255,255,0.02)';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 40) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
        }
        for (let i = 0; i < canvas.height; i += 40) {
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
        }

        // Draw edges
        const drawn = new Set();
        const nodes = network.nodes;
        // Build edge list from node connections (simplified: draw between nearby nodes)
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const [x1, y1] = latLngToXY(nodes[i].lat, nodes[i].lng);
                const [x2, y2] = latLngToXY(nodes[j].lat, nodes[j].lng);
                const dist = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
                if (dist < 200) {
                    const key = `${nodes[i].name}-${nodes[j].name}`;
                    if (!drawn.has(key)) {
                        drawn.add(key);
                        ctx.beginPath();
                        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
                        ctx.strokeStyle = 'rgba(255,77,109,0.15)';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }
        }

        // Draw highlight path
        if (highlightPath && highlightPath.length > 1) {
            ctx.beginPath();
            const [sx, sy] = latLngToXY(highlightPath[0].lat, highlightPath[0].lng);
            ctx.moveTo(sx, sy);
            for (let i = 1; i < highlightPath.length; i++) {
                const [px, py] = latLngToXY(highlightPath[i].lat, highlightPath[i].lng);
                ctx.lineTo(px, py);
            }
            ctx.strokeStyle = '#14b8a6';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#14b8a6';
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Animated dots on path
            highlightPath.forEach((p, i) => {
                const [px, py] = latLngToXY(p.lat, p.lng);
                ctx.beginPath();
                ctx.arc(px, py, i === 0 || i === highlightPath.length - 1 ? 7 : 5, 0, Math.PI * 2);
                ctx.fillStyle = i === 0 ? '#22c55e' : i === highlightPath.length - 1 ? '#ef4444' : '#14b8a6';
                ctx.fill();
                
                // Draw a pulsing border around start/end snapping points
                if (i === 0 || i === highlightPath.length - 1) {
                    ctx.beginPath();
                    ctx.arc(px, py, 11, 0, Math.PI * 2);
                    ctx.strokeStyle = i === 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Text label offset
                    ctx.fillStyle = i === 0 ? '#22c55e' : '#ef4444';
                    ctx.font = 'bold 9px JetBrains Mono';
                    ctx.textAlign = 'center';
                    ctx.fillText(i === 0 ? 'START' : 'END', px, py + 20);
                }
            });
        }

        // Draw nodes
        nodes.forEach(node => {
            const [x, y] = latLngToXY(node.lat, node.lng);
            // Outer glow
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,77,109,0.1)';
            ctx.fill();
            // Inner dot
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ff4d6d';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,77,109,0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
            // Label
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '10px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(node.name.replace(/_/g, ' '), x, y - 16);
        });
    }

    drawNetwork();

    // Network stats
    document.getElementById('network-stats').innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="inventory-item"><div style="font-size:11px;color:var(--text-muted);">NODES</div><div style="font-size:24px;font-weight:800;">${network.total_nodes}</div></div>
            <div class="inventory-item"><div style="font-size:11px;color:var(--text-muted);">EDGES</div><div style="font-size:24px;font-weight:800;">${network.total_edges}</div></div>
            <div class="inventory-item"><div style="font-size:11px;color:var(--text-muted);">CITY</div><div style="font-size:14px;font-weight:700;">${network.city}</div></div>
            <div class="inventory-item"><div style="font-size:11px;color:var(--text-muted);">ALGORITHMS</div><div style="font-size:12px;font-weight:600;">${network.algorithms.join(', ')}</div></div>
        </div>
        <div style="margin-top:16px;">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">ALL ZONES</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;">
                ${network.nodes.map(n => `<span class="tag">${n.name.replace(/_/g, ' ')}</span>`).join('')}
            </div>
        </div>
    `;

    // Interactive Canvas Node Selection
    let selectToggle = 'origin';
    canvas.addEventListener('click', (e) => {
        const bounds = canvas.getBoundingClientRect();
        const mx = e.clientX - bounds.left;
        const my = e.clientY - bounds.top;

        for (const node of network.nodes) {
            const [nx, ny] = latLngToXY(node.lat, node.lng);
            const dist = Math.sqrt((mx - nx)**2 + (my - ny)**2);
            if (dist < 15) {
                const val = `${node.lat}, ${node.lng}`;
                if (selectToggle === 'origin') {
                    origSelect.value = val;
                    origInput.value = val;
                    selectToggle = 'destination';
                    document.getElementById('route-result').innerHTML = `
                        <div style="font-size:12px;color:var(--text-secondary);padding:6px;background:rgba(255,255,255,0.02);border-radius:4px;">
                            📍 Set Origin to **${node.name.replace(/_/g, ' ').toUpperCase()}**. Now click another node to set Destination.
                        </div>
                    `;
                } else {
                    destSelect.value = val;
                    destInput.value = val;
                    selectToggle = 'origin';
                    document.getElementById('route-result').innerHTML = `
                        <div style="font-size:12px;color:var(--text-secondary);padding:6px;background:rgba(255,255,255,0.02);border-radius:4px;">
                            📍 Set Destination to **${node.name.replace(/_/g, ' ').toUpperCase()}**. Click 'Find Optimal Route' to search.
                        </div>
                    `;
                }
                break;
            }
        }
    });

    // Route finder
    document.getElementById('find-route').addEventListener('click', async () => {
        const origin = document.getElementById('route-origin').value.split(',').map(Number);
        const dest = document.getElementById('route-dest').value.split(',').map(Number);
        const result = await api.get(`/api/analytics/routing/find?olat=${origin[0]}&olng=${origin[1]}&dlat=${dest[0]}&dlng=${dest[1]}`);
        if (result) {
            drawNetwork(result.path);
            document.getElementById('route-result').innerHTML = `
                <div style="padding:12px;background:rgba(20,184,166,0.1);border:1px solid rgba(20,184,166,0.3);border-radius:8px;">
                    <div style="font-weight:700;color:var(--accent-400);margin-bottom:8px;">✅ Route Found — ${result.algorithm_used}</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;">
                        <div>📏 Distance: <strong>${result.distance_km} km</strong></div>
                        <div>⏱️ ETA: <strong>${result.estimated_time_minutes} min</strong></div>
                        <div>🗺️ Zones: <strong>${result.path.length}</strong></div>
                        <div>🧠 Algorithm: <strong>${result.algorithm_used}</strong></div>
                    </div>
                    <div style="margin-top:8px;font-size:11px;color:var(--text-muted);">
                        Path: ${result.path.map(p => p.name.replace(/_/g, ' ')).join(' → ')}
                    </div>
                </div>
            `;
        }
    });
}
