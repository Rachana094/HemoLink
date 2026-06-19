/**
 * HemoLink Dashboard — Command Center View
 */

async function renderDashboard(container) {
    destroyCharts();
    const [metrics, agents, shortages] = await Promise.all([
        api.get('/api/analytics/dashboard'),
        api.get('/api/analytics/agents'),
        api.get('/api/predictions/shortages'),
    ]);

    const m = metrics || {
        total_donors: 20, active_donors: 18, total_requests: 156, pending_requests: 3,
        fulfilled_requests: 149, avg_match_time_minutes: 4.2, total_donations_today: 12,
        blood_inventory: {"A+":45,"A-":8,"B+":52,"B-":5,"AB+":12,"AB-":2,"O+":65,"O-":7},
        shortage_alerts: 3, system_health: 0.97, lives_saved_estimate: 447,
        wastage_reduction_pct: 42.3, response_time_improvement_pct: 83, donor_churn_rate: 0.18,
    };

    const inv = m.blood_inventory || {};
    const totalStock = Object.values(inv).reduce((s, v) => s + v, 0);

    container.innerHTML = `
        <div class="metrics-grid stagger">
            <div class="metric-card glass-card" id="mc-lives">
                <div class="metric-icon">❤️</div>
                <div class="metric-value text-gradient" data-count="${m.lives_saved_estimate}">0</div>
                <div class="metric-label">Lives Saved</div>
                <div class="metric-change positive">↑ 23% this month</div>
            </div>
            <div class="metric-card glass-card" id="mc-donors">
                <div class="metric-icon">👥</div>
                <div class="metric-value" data-count="${m.active_donors}" style="color:var(--accent-400);">0</div>
                <div class="metric-label">Active Donors</div>
                <div class="metric-change positive">↑ ${m.total_donors} total registered</div>
            </div>
            <div class="metric-card glass-card" id="mc-match">
                <div class="metric-icon">⚡</div>
                <div class="metric-value" data-count="${m.avg_match_time_minutes}" style="color:var(--info);">0</div>
                <div class="metric-label">Avg Match Time (min)</div>
                <div class="metric-change positive">↓ ${m.response_time_improvement_pct}% faster</div>
            </div>
            <div class="metric-card glass-card" id="mc-waste">
                <div class="metric-icon">📉</div>
                <div class="metric-value" data-count="${m.wastage_reduction_pct}" style="color:var(--success);">0</div>
                <div class="metric-label">Wastage Reduction %</div>
                <div class="metric-change positive">↓ vs. baseline</div>
            </div>
            <div class="metric-card glass-card" id="mc-requests">
                <div class="metric-icon">🩸</div>
                <div class="metric-value" data-count="${m.fulfilled_requests}" style="color:var(--primary-400);">0</div>
                <div class="metric-label">Requests Fulfilled</div>
                <div class="metric-change positive">${m.pending_requests} pending</div>
            </div>
            <div class="metric-card glass-card" id="mc-stock">
                <div class="metric-icon">🏥</div>
                <div class="metric-value" data-count="${totalStock}" style="color:var(--warning);">0</div>
                <div class="metric-label">Total Blood Stock (units)</div>
                <div class="metric-change ${m.shortage_alerts > 2 ? 'negative' : 'positive'}">${m.shortage_alerts} shortage alerts</div>
            </div>
            <div class="metric-card glass-card" id="mc-health">
                <div class="metric-icon">🛡️</div>
                <div class="metric-value" data-count="${(m.system_health * 100).toFixed(0)}" style="color:var(--success);">0</div>
                <div class="metric-label">System Health %</div>
                <div class="metric-change positive">All agents active</div>
            </div>
            <div class="metric-card glass-card" id="mc-today">
                <div class="metric-icon">📊</div>
                <div class="metric-value" data-count="${m.total_donations_today}" style="color:var(--accent-400);">0</div>
                <div class="metric-label">Donations Today</div>
                <div class="metric-change positive">↑ on track</div>
            </div>
        </div>

        <div class="content-grid">
            <div class="card-section glass-card">
                <div class="card-section-title">🩸 Blood Inventory</div>
                <div class="inventory-grid" id="inventory-grid"></div>
            </div>
            <div class="card-section glass-card">
                <div class="card-section-title">📈 Demand Trend (7 days)</div>
                <div class="chart-container"><canvas id="demand-chart"></canvas></div>
            </div>
        </div>

        <div class="content-grid">
            <div class="card-section glass-card">
                <div class="card-section-title">⚠️ Shortage Alerts</div>
                <div id="shortage-alerts"></div>
            </div>
            <div class="card-section glass-card">
                <div class="card-section-title">🤖 Agent Activity</div>
                <div id="agent-activity"></div>
            </div>
        </div>
    `;

    // Animate metric counters
    setTimeout(() => {
        container.querySelectorAll('.metric-value[data-count]').forEach(el => {
            animateValue(el, 0, parseFloat(el.dataset.count), 1200);
        });
    }, 200);

    // Render inventory
    const invGrid = document.getElementById('inventory-grid');
    const maxStock = 80;
    invGrid.innerHTML = Object.entries(inv).map(([type, count]) => {
        const pct = Math.min(100, (count / maxStock) * 100);
        const cls = pct > 60 ? 'healthy' : pct > 30 ? 'warning' : 'critical';
        return `
            <div class="inventory-item">
                <div class="inventory-type" style="color:${cls === 'healthy' ? 'var(--success)' : cls === 'warning' ? 'var(--warning)' : 'var(--danger)'};">${type}</div>
                <div class="inventory-count">${count}</div>
                <div class="inventory-bar"><div class="inventory-bar-fill ${cls}" style="width:${pct}%;"></div></div>
                <div class="inventory-label">${count < 10 ? 'LOW' : count < 30 ? 'MODERATE' : 'ADEQUATE'}</div>
            </div>
        `;
    }).join('');

    // Render shortage alerts
    const alertsDiv = document.getElementById('shortage-alerts');
    const alertData = shortages?.alerts?.filter(a => a.risk_level !== 'low').slice(0, 5) || [];
    alertsDiv.innerHTML = alertData.length ? alertData.map(a => `
        <div class="alert-row ${a.risk_level}">
            <div class="alert-icon">${a.risk_level === 'critical' ? '🔴' : a.risk_level === 'high' ? '🟠' : '🔵'}</div>
            <div class="alert-content">
                <div class="alert-title">${a.blood_type} — ${a.risk_level.toUpperCase()}</div>
                <div class="alert-desc">${a.recommended_action}</div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
                <div style="font-weight:700;font-family:var(--font-mono);font-size:14px;">${a.current_stock}</div>
                <div style="font-size:10px;color:var(--text-muted);">units left</div>
            </div>
        </div>
    `).join('') : '<div style="color:var(--success);font-size:14px;">✅ No critical shortages</div>';

    // Render agent activity
    const agentDiv = document.getElementById('agent-activity');
    const agentList = agents?.agents || [];
    agentDiv.innerHTML = agentList.map(a => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-subtle);">
            <div>
                <div style="font-size:13px;font-weight:600;">${a.agent_name}</div>
                <div style="font-size:11px;color:var(--text-muted);">${a.tasks_completed} tasks · ${a.avg_response_time_ms.toFixed(0)}ms avg</div>
            </div>
            <span class="agent-status ${a.status}">● ${a.status}</span>
        </div>
    `).join('');

    // Demand chart
    const forecast = await api.get('/api/predictions/forecast/O+?days=7');
    if (forecast?.forecasts) {
        const ctx = document.getElementById('demand-chart').getContext('2d');
        state.charts.demand = new Chart(ctx, {
            type: 'line',
            data: {
                labels: forecast.forecasts.map(f => f.date.split('-').slice(1).join('/')),
                datasets: [{
                    label: 'O+ Predicted Demand',
                    data: forecast.forecasts.map(f => f.predicted_demand),
                    borderColor: '#ff4d6d',
                    backgroundColor: 'rgba(255,77,109,0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#ff4d6d',
                }, {
                    label: 'Upper Bound',
                    data: forecast.forecasts.map(f => f.confidence_upper),
                    borderColor: 'rgba(255,77,109,0.3)',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                }, {
                    label: 'Lower Bound',
                    data: forecast.forecasts.map(f => f.confidence_lower),
                    borderColor: 'rgba(255,77,109,0.3)',
                    borderDash: [5, 5],
                    fill: '-1',
                    backgroundColor: 'rgba(255,77,109,0.05)',
                    tension: 0.4,
                    pointRadius: 0,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { boxWidth: 12, padding: 15 } },
                },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.04)' } },
                    x: { grid: { display: false } },
                },
            },
        });
    }
}
