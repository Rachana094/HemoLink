/**
 * HemoLink Predictions — Forecasting & Shortage Intelligence View
 */

async function renderPredictions(container) {
    destroyCharts();
    container.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">🔮 Predictive Intelligence</div>
                <div class="section-subtitle">LSTM demand forecasting · XGBoost shortage prediction · Random Forest risk classification</div>
            </div>
            <div style="display:flex;gap:8px;">
                <select id="pred-bt" class="form-select" style="width:100px;">
                    <option value="O+">O+</option><option value="O-">O-</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                </select>
                <button id="pred-refresh" class="btn btn-ghost">Refresh</button>
            </div>
        </div>

        <div class="content-grid">
            <div class="card-section glass-card" style="grid-column:1/-1;">
                <div class="card-section-title">📈 30-Day Demand Forecast</div>
                <div class="chart-container" style="min-height:320px;"><canvas id="forecast-chart"></canvas></div>
            </div>
        </div>

        <div class="content-grid">
            <div class="card-section glass-card">
                <div class="card-section-title">⚠️ Shortage Risk Matrix</div>
                <div id="shortage-matrix"></div>
            </div>
            <div class="card-section glass-card">
                <div class="card-section-title">🎯 Risk Scores by Blood Type</div>
                <div class="chart-container"><canvas id="risk-chart"></canvas></div>
            </div>
        </div>

        <div class="content-grid">
            <div class="card-section glass-card">
                <div class="card-section-title">🧠 Model Performance</div>
                <div id="model-perf"></div>
            </div>
            <div class="card-section glass-card">
                <div class="card-section-title">📊 Multi-Type Comparison</div>
                <div class="chart-container"><canvas id="compare-chart"></canvas></div>
            </div>
        </div>
    `;

    const loadPredictions = async (bt) => {
        const [forecast, shortages, risks, perf] = await Promise.all([
            api.get(`/api/predictions/forecast/${bt}?days=30`),
            api.get('/api/predictions/shortages'),
            api.get('/api/predictions/risk-scores'),
            api.get('/api/predictions/model-performance'),
        ]);

        // Forecast chart
        if (forecast?.forecasts) {
            const ctx = document.getElementById('forecast-chart');
            if (state.charts.forecast) state.charts.forecast.destroy();
            state.charts.forecast = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: forecast.forecasts.map(f => f.date.split('-').slice(1).join('/')),
                    datasets: [{
                        label: `${bt} Demand (LSTM)`,
                        data: forecast.forecasts.map(f => f.predicted_demand),
                        borderColor: '#ff4d6d', backgroundColor: 'rgba(255,77,109,0.08)',
                        fill: true, tension: 0.4, pointRadius: 2, borderWidth: 2,
                    }, {
                        label: 'Confidence Upper',
                        data: forecast.forecasts.map(f => f.confidence_upper),
                        borderColor: 'rgba(255,77,109,0.2)', borderDash: [4, 4],
                        fill: false, tension: 0.4, pointRadius: 0, borderWidth: 1,
                    }, {
                        label: 'Confidence Lower',
                        data: forecast.forecasts.map(f => f.confidence_lower),
                        borderColor: 'rgba(255,77,109,0.2)', borderDash: [4, 4],
                        fill: '-1', backgroundColor: 'rgba(255,77,109,0.04)',
                        tension: 0.4, pointRadius: 0, borderWidth: 1,
                    }],
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { labels: { boxWidth: 10 } } },
                    scales: {
                        y: { title: { display: true, text: 'Units' }, grid: { color: 'rgba(255,255,255,0.04)' } },
                        x: { grid: { display: false } },
                    },
                },
            });
        }

        // Shortage matrix
        if (shortages?.alerts) {
            document.getElementById('shortage-matrix').innerHTML = shortages.alerts.map(a => `
                <div class="alert-row ${a.risk_level}" style="animation:fadeIn 0.3s ease;">
                    <div style="font-weight:700;font-family:var(--font-mono);width:40px;">${a.blood_type}</div>
                    <div class="alert-content">
                        <div class="alert-title">${a.risk_level.toUpperCase()} — Lead: ${a.lead_time_hours}h</div>
                        <div class="alert-desc">Stock: ${a.current_stock} | 7d demand: ${a.predicted_demand_7d}</div>
                    </div>
                    <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${
                        a.risk_level === 'critical' ? 'var(--danger)' : a.risk_level === 'high' ? 'var(--warning)' : 'var(--success)'
                    };">${(a.risk_score * 100).toFixed(0)}%</div>
                </div>
            `).join('');
        }

        // Risk chart
        if (risks?.scores) {
            const ctx2 = document.getElementById('risk-chart');
            if (state.charts.risk) state.charts.risk.destroy();
            const labels = Object.keys(risks.scores);
            const values = Object.values(risks.scores);
            state.charts.risk = new Chart(ctx2, {
                type: 'radar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Risk Score',
                        data: values,
                        borderColor: '#ff4d6d', backgroundColor: 'rgba(255,77,109,0.15)',
                        pointBackgroundColor: '#ff4d6d', pointRadius: 4,
                    }],
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: { r: { min: 0, max: 1, grid: { color: 'rgba(255,255,255,0.06)' }, pointLabels: { font: { size: 11 } } } },
                    plugins: { legend: { display: false } },
                },
            });
        }

        // Model performance
        if (perf) {
            document.getElementById('model-perf').innerHTML = Object.entries(perf).map(([key, m]) => `
                <div style="padding:12px;background:rgba(255,255,255,0.02);border-radius:8px;margin-bottom:8px;border:1px solid var(--border-subtle);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <span class="tag tag-accent">${m.model}</span>
                            <span style="font-size:11px;color:var(--text-muted);margin-left:8px;">${key.replace(/_/g, ' ')}</span>
                        </div>
                        <div style="font-family:var(--font-mono);font-size:13px;">
                            ${m.mape ? `MAPE: ${m.mape}` : ''}${m.precision ? `P: ${m.precision}` : ''}${m.accuracy ? `Acc: ${m.accuracy}` : ''}${m.auc ? ` AUC: ${m.auc}` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Comparison chart
        const allForecasts = await Promise.all(
            ['O+', 'A+', 'B+', 'AB+'].map(t => api.get(`/api/predictions/forecast/${t}?days=14`))
        );
        const ctx3 = document.getElementById('compare-chart');
        if (state.charts.compare) state.charts.compare.destroy();
        const colors = ['#ff4d6d', '#3b82f6', '#a855f7', '#f59e0b'];
        state.charts.compare = new Chart(ctx3, {
            type: 'bar',
            data: {
                labels: (allForecasts[0]?.forecasts || []).slice(0, 14).map(f => f.date.split('-')[2]),
                datasets: ['O+', 'A+', 'B+', 'AB+'].map((t, i) => ({
                    label: t,
                    data: (allForecasts[i]?.forecasts || []).slice(0, 14).map(f => f.predicted_demand),
                    backgroundColor: colors[i] + '40', borderColor: colors[i], borderWidth: 1,
                })),
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { boxWidth: 10 } } },
                scales: {
                    y: { stacked: true, grid: { color: 'rgba(255,255,255,0.04)' } },
                    x: { stacked: true, grid: { display: false } },
                },
            },
        });
    };

    loadPredictions('O+');
    document.getElementById('pred-bt').addEventListener('change', (e) => loadPredictions(e.target.value));
    document.getElementById('pred-refresh').addEventListener('click', () => loadPredictions(document.getElementById('pred-bt').value));
}
