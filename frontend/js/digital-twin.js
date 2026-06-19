/**
 * HemoLink Digital Twin Explorer — Donor profile scoring & visualization
 */

async function renderDigitalTwin(container) {
    destroyCharts();
    container.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">⬢ Digital Twin Explorer</div>
                <div class="section-subtitle">Comprehensive donor profiles with multi-dimensional scoring: reliability, engagement, risk, availability</div>
            </div>
        </div>

        <div class="content-grid">
            <div class="card-section glass-card">
                <div class="card-section-title">👥 Donor Registry</div>
                <div style="max-height:500px;overflow-y:auto;" id="donor-list"></div>
            </div>
            <div class="card-section glass-card" id="twin-detail">
                <div class="card-section-title">🧬 Digital Twin Profile</div>
                <div id="twin-content" style="text-align:center;padding:40px;color:var(--text-muted);">
                    Select a donor to view their Digital Twin profile
                </div>
            </div>
        </div>

        <div class="content-grid full-width">
            <div class="card-section glass-card">
                <div class="card-section-title">📊 Donor Score Distribution</div>
                <div class="chart-container"><canvas id="twin-chart"></canvas></div>
            </div>
        </div>
    `;

    const donors = await api.get('/api/donors/?limit=50');
    if (!donors || !donors.length) return;

    // Render donor list
    const listDiv = document.getElementById('donor-list');
    listDiv.innerHTML = donors.map((d, i) => `
        <div class="match-card" style="cursor:pointer;animation:fadeIn 0.2s ease ${i * 0.03}s both;" data-id="${d.id}" onclick="loadTwinProfile('${d.id}')">
            <div style="width:36px;height:36px;border-radius:50%;background:rgba(255,77,109,0.1);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:var(--primary-400);flex-shrink:0;">
                ${d.blood_type}
            </div>
            <div class="match-info">
                <div class="match-name">${d.name}</div>
                <div class="match-details">${d.city} · ${d.total_donations} donations · ${d.is_eligible ? '✅ Eligible' : '❌ Deferred'}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:14px;font-weight:700;color:${d.reliability_score > 0.7 ? 'var(--success)' : d.reliability_score > 0.4 ? 'var(--warning)' : 'var(--danger)'};">
                    ${(d.reliability_score * 100).toFixed(0)}%
                </div>
                <div style="font-size:10px;color:var(--text-muted);">reliability</div>
            </div>
        </div>
    `).join('');

    // Score distribution chart
    const ctx = document.getElementById('twin-chart');
    state.charts.twinDist = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Donors',
                data: donors.map(d => ({ x: d.reliability_score, y: d.engagement_score, r: (1 - d.risk_score) * 15 + 3 })),
                backgroundColor: donors.map(d => d.churn_risk > 0.5 ? 'rgba(239,68,68,0.5)' : 'rgba(34,197,94,0.5)'),
                borderColor: donors.map(d => d.churn_risk > 0.5 ? '#ef4444' : '#22c55e'),
                borderWidth: 1,
            }],
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Reliability Score' }, min: 0, max: 1, grid: { color: 'rgba(255,255,255,0.04)' } },
                y: { title: { display: true, text: 'Engagement Score' }, min: 0, max: 1, grid: { color: 'rgba(255,255,255,0.04)' } },
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const d = donors[ctx.dataIndex];
                            return `${d.name}: R=${d.reliability_score.toFixed(2)}, E=${d.engagement_score.toFixed(2)}`;
                        }
                    }
                }
            },
        },
    });
}

async function loadTwinProfile(donorId) {
    const twin = await api.get(`/api/donors/${donorId}/digital-twin`);
    if (!twin) return;

    const content = document.getElementById('twin-content');
    const circumference = 2 * Math.PI * 38;

    function ringOffset(score) {
        return circumference * (1 - score);
    }

    function ringColor(score) {
        if (score > 0.7) return '#22c55e';
        if (score > 0.4) return '#f59e0b';
        return '#ef4444';
    }

    content.innerHTML = `
        <div style="text-align:left;">
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
                <div style="width:56px;height:56px;border-radius:50%;background:var(--gradient-primary);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;color:white;">
                    ${twin.blood_type}
                </div>
                <div>
                    <div style="font-size:18px;font-weight:800;">${twin.name}</div>
                    <div style="font-size:13px;color:var(--text-muted);">${twin.total_donations} donations · Composite: ${(twin.composite_score * 100).toFixed(0)}%</div>
                </div>
            </div>

            <div class="score-ring-container" style="margin-bottom:24px;">
                ${['reliability_score', 'engagement_score', 'availability_score'].map(key => {
                    const val = twin[key];
                    const label = key.replace('_score', '').toUpperCase();
                    return `
                        <div class="score-ring">
                            <svg viewBox="0 0 84 84">
                                <circle class="score-ring-bg" cx="42" cy="42" r="38"/>
                                <circle class="score-ring-fill" cx="42" cy="42" r="38"
                                    stroke="${ringColor(val)}"
                                    stroke-dasharray="${circumference}"
                                    stroke-dashoffset="${ringOffset(val)}"/>
                            </svg>
                            <div class="score-ring-label">
                                <span class="score-ring-value" style="color:${ringColor(val)};">${(val * 100).toFixed(0)}%</span>
                                <span class="score-ring-name">${label}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
                <div class="score-ring">
                    <svg viewBox="0 0 84 84">
                        <circle class="score-ring-bg" cx="42" cy="42" r="38"/>
                        <circle class="score-ring-fill" cx="42" cy="42" r="38"
                            stroke="${ringColor(1 - twin.risk_score)}"
                            stroke-dasharray="${circumference}"
                            stroke-dashoffset="${ringOffset(1 - twin.risk_score)}"/>
                    </svg>
                    <div class="score-ring-label">
                        <span class="score-ring-value" style="color:${ringColor(1 - twin.risk_score)};">${((1 - twin.risk_score) * 100).toFixed(0)}%</span>
                        <span class="score-ring-name">SAFETY</span>
                    </div>
                </div>
            </div>

            <div style="margin-bottom:20px;">
                <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:8px;">CHURN RISK</div>
                <div class="progress-bar" style="height:8px;">
                    <div class="progress-fill" style="width:${twin.churn_risk * 100}%;background:${twin.churn_risk > 0.5 ? 'var(--danger)' : 'var(--success)'};"></div>
                </div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">${(twin.churn_risk * 100).toFixed(0)}% — ${twin.churn_risk > 0.7 ? 'HIGH RISK' : twin.churn_risk > 0.4 ? 'MODERATE' : 'LOW RISK'}</div>
            </div>

            <div style="margin-bottom:20px;">
                <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:8px;">PREFERENCES</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <span class="tag tag-primary">🕐 ${twin.preference_vector.time}</span>
                    <span class="tag tag-accent">🏥 ${twin.preference_vector.location}</span>
                    <span class="tag">📱 ${twin.preference_vector.contact}</span>
                    <span class="tag">📏 ${twin.preference_vector.max_distance_km} km max</span>
                </div>
            </div>

            <div>
                <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:8px;">SCORING BREAKDOWN</div>
                ${Object.entries(twin.scoring_breakdown).map(([key, data]) => `
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <div style="width:80px;font-size:11px;color:var(--text-muted);text-transform:capitalize;">${key}</div>
                        <div style="flex:1;"><div class="progress-bar"><div class="progress-fill" style="width:${data.value * 100}%;"></div></div></div>
                        <div style="width:40px;font-family:var(--font-mono);font-size:12px;text-align:right;">${(data.value * 100).toFixed(0)}%</div>
                        <div style="width:30px;font-size:10px;color:var(--text-muted);">×${data.weight}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}
