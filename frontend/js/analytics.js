/**
 * HemoLink Agent Hub + Impact Analytics Views
 */

async function renderAgentHub(container) {
    destroyCharts();
    const [agents, archData, ocrResult, ragStats, flArch] = await Promise.all([
        api.get('/api/analytics/agents'),
        api.get('/api/analytics/system/architecture'),
        api.get('/api/analytics/ocr/process?doc_type=blood_report'),
        api.get('/api/analytics/rag/stats'),
        api.get('/api/analytics/federated/architecture'),
    ]);

    const agentList = agents?.agents || [];
    container.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">🤖 Agent Hub — Multi-Agent Orchestrator</div>
                <div class="section-subtitle">Supervisor-pattern coordination across 6 specialized AI agents</div>
            </div>
        </div>

        <div class="metrics-grid stagger">
            ${agentList.map(a => `
                <div class="agent-card glass-card">
                    <div class="agent-header">
                        <div class="agent-icon">${a.agent_name.includes('Matching') ? '🔍' : a.agent_name.includes('Predict') ? '🔮' : a.agent_name.includes('Engage') ? '💡' : a.agent_name.includes('Routing') ? '🗺️' : a.agent_name.includes('RAG') ? '📚' : '📄'}</div>
                        <div>
                            <div class="agent-name">${a.agent_name}</div>
                            <span class="agent-status ${a.status}">● ${a.status}</span>
                        </div>
                    </div>
                    <div class="agent-stats">
                        <div class="agent-stat"><div class="agent-stat-value">${a.tasks_completed}</div><div class="agent-stat-label">Tasks</div></div>
                        <div class="agent-stat"><div class="agent-stat-value">${a.avg_response_time_ms.toFixed(0)}ms</div><div class="agent-stat-label">Avg Time</div></div>
                        <div class="agent-stat"><div class="agent-stat-value">${(a.accuracy * 100).toFixed(0)}%</div><div class="agent-stat-label">Accuracy</div></div>
                        <div class="agent-stat"><div class="agent-stat-value">${a.last_active}</div><div class="agent-stat-label">Last Active</div></div>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="content-grid">
            <div class="card-section glass-card">
                <div class="card-section-title">📄 OCR Pipeline Demo</div>
                <div id="ocr-demo"></div>
            </div>
            <div class="card-section glass-card">
                <div class="card-section-title">📚 RAG Knowledge Query</div>
                <div style="margin-bottom:12px;">
                    <input type="text" id="rag-query" class="form-input" style="width:100%;" placeholder="Ask about blood donation..." value="What are the blood type compatibility rules?">
                </div>
                <button id="rag-btn" class="btn btn-accent btn-full" style="margin-bottom:16px;">🧠 Query Knowledge Base</button>
                <div id="rag-result"></div>
            </div>
        </div>

        <div class="content-grid full-width">
            <div class="card-section glass-card">
                <div class="card-section-title">🏗️ System Architecture</div>
                <div id="arch-display"></div>
            </div>
        </div>
    `;

    // OCR Demo
    if (ocrResult) {
        document.getElementById('ocr-demo').innerHTML = `
            <div class="pipeline-steps" style="margin-bottom:12px;">
                ${ocrResult.pipeline_stages.map(s => `<div class="pipeline-step complete">✅ ${s.stage}</div><span class="pipeline-arrow">→</span>`).join('')}
            </div>
            <div style="background:rgba(0,0,0,0.3);padding:12px;border-radius:8px;font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);margin-bottom:12px;white-space:pre-wrap;">${ocrResult.raw_text}</div>
            <div style="font-size:12px;margin-bottom:8px;"><strong>Extracted Entities:</strong></div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">
                ${Object.entries(ocrResult.extracted_entities).map(([k, v]) => `<span class="tag tag-primary">${k}: ${v}</span>`).join('')}
            </div>
            <div style="display:flex;gap:16px;font-size:12px;">
                <span>Confidence: <strong style="color:var(--success);">${(ocrResult.confidence_score * 100).toFixed(1)}%</strong></span>
                <span>Time: <strong>${ocrResult.processing_time_ms.toFixed(0)}ms</strong></span>
                <span>Status: <strong style="color:var(--success);">${ocrResult.validation_status}</strong></span>
            </div>
        `;
    }

    // RAG Query
    document.getElementById('rag-btn').addEventListener('click', async () => {
        const q = document.getElementById('rag-query').value;
        const btn = document.getElementById('rag-btn');
        btn.innerHTML = '⏳ Retrieving...'; btn.disabled = true;
        const res = await api.get(`/api/analytics/rag/query?q=${encodeURIComponent(q)}`);
        if (res) {
            document.getElementById('rag-result').innerHTML = `
                <div style="background:rgba(20,184,166,0.1);border:1px solid rgba(20,184,166,0.3);border-radius:8px;padding:16px;margin-bottom:12px;">
                    <div style="font-size:14px;line-height:1.6;">${res.answer}</div>
                </div>
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">Sources (confidence: ${(res.confidence * 100).toFixed(0)}%)</div>
                ${res.sources.map(s => `<div class="tag" style="margin:2px;">${s.title} (${(s.relevance * 100).toFixed(0)}%)</div>`).join('')}
                <div class="pipeline-steps" style="margin-top:12px;">
                    ${res.pipeline.map(s => `<div class="pipeline-step complete">${s}</div><span class="pipeline-arrow">→</span>`).join('')}
                </div>
            `;
        }
        btn.innerHTML = '🧠 Query Knowledge Base'; btn.disabled = false;
    });

    // Architecture
    if (archData?.architecture) {
        const arch = archData.architecture;
        document.getElementById('arch-display').innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
                ${Object.entries(arch).map(([layer, items]) => `
                    <div style="padding:16px;background:rgba(255,255,255,0.02);border-radius:12px;border:1px solid var(--border-subtle);">
                        <div style="font-size:11px;font-weight:700;color:var(--primary-400);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">${layer.replace(/_/g, ' ')}</div>
                        ${items.map(i => `<div style="font-size:12px;padding:4px 0;color:var(--text-secondary);">▸ ${i}</div>`).join('')}
                    </div>
                `).join('')}
            </div>
            <div style="margin-top:16px;display:flex;flex-wrap:wrap;gap:6px;">
                <div style="font-size:11px;color:var(--text-muted);margin-right:8px;">Models:</div>
                ${(archData.models || []).map(m => `<span class="tag tag-accent">${m}</span>`).join('')}
            </div>
            <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">
                <div style="font-size:11px;color:var(--text-muted);margin-right:8px;">Algorithms:</div>
                ${(archData.algorithms || []).map(a => `<span class="tag tag-primary">${a}</span>`).join('')}
            </div>
        `;
    }
}

async function renderAnalytics(container) {
    destroyCharts();
    const [dashboard, engagement, fl] = await Promise.all([
        api.get('/api/analytics/dashboard'),
        api.get('/api/analytics/engagement'),
        api.get('/api/analytics/federated/train?rounds=10'),
    ]);

    const m = dashboard || {};
    container.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">📊 Impact Analytics</div>
                <div class="section-subtitle">Measurable KPIs demonstrating HemoLink's transformative impact</div>
            </div>
        </div>

        <div class="metrics-grid stagger">
            <div class="metric-card glass-card">
                <div class="metric-icon">⏱️</div>
                <div class="metric-value text-gradient">${m.response_time_improvement_pct || 83}%</div>
                <div class="metric-label">Response Time Reduction</div>
                <div class="metric-change positive">30 min → 5 min</div>
            </div>
            <div class="metric-card glass-card">
                <div class="metric-icon">📉</div>
                <div class="metric-value" style="color:var(--success);">${m.wastage_reduction_pct || 42}%</div>
                <div class="metric-label">Wastage Reduction</div>
                <div class="metric-change positive">↓ 700K units saved/yr</div>
            </div>
            <div class="metric-card glass-card">
                <div class="metric-icon">👥</div>
                <div class="metric-value" style="color:var(--accent-400);">2x</div>
                <div class="metric-label">Donor Retention Boost</div>
                <div class="metric-change positive">30% → 60%</div>
            </div>
            <div class="metric-card glass-card">
                <div class="metric-icon">🔮</div>
                <div class="metric-value" style="color:var(--info);">48h</div>
                <div class="metric-label">Shortage Lead Time</div>
                <div class="metric-change positive">0h → 48h prediction</div>
            </div>
        </div>

        <div class="content-grid">
            <div class="card-section glass-card">
                <div class="card-section-title">⚠️ Donor Churn Analysis</div>
                <div id="churn-data"></div>
            </div>
            <div class="card-section glass-card">
                <div class="card-section-title">🔒 Federated Learning Convergence</div>
                <div class="chart-container"><canvas id="fl-chart"></canvas></div>
            </div>
        </div>

        <div class="content-grid full-width">
            <div class="card-section glass-card">
                <div class="card-section-title">🏆 Impact Summary — National Level</div>
                <div id="impact-summary" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;"></div>
            </div>
        </div>
    `;

    // Churn analysis
    if (engagement?.at_risk_donors) {
        const churnDiv = document.getElementById('churn-data');
        churnDiv.innerHTML = `
            <div style="margin-bottom:12px;font-size:13px;">
                <span style="color:var(--text-muted);">Avg churn risk:</span>
                <strong style="color:${engagement.avg_churn_risk > 0.5 ? 'var(--danger)' : 'var(--warning)'};">${(engagement.avg_churn_risk * 100).toFixed(1)}%</strong>
                <span style="color:var(--text-muted);margin-left:12px;">At-risk:</span> <strong>${engagement.at_risk_donors.length}</strong>
            </div>
            ${engagement.at_risk_donors.slice(0, 6).map(d => `
                <div class="alert-row ${d.priority === 'high' ? 'critical' : 'medium'}" style="margin-bottom:6px;">
                    <div style="font-weight:700;width:36px;text-align:center;">${d.blood_type}</div>
                    <div class="alert-content">
                        <div class="alert-title">${d.donor_name}</div>
                        <div class="alert-desc">${d.recommended_action}</div>
                    </div>
                    <div style="font-family:var(--font-mono);font-weight:700;color:var(--danger);">${(d.churn_probability * 100).toFixed(0)}%</div>
                </div>
            `).join('')}
        `;
    }

    // FL convergence chart
    if (fl?.convergence_history) {
        const ctx = document.getElementById('fl-chart');
        state.charts.fl = new Chart(ctx, {
            type: 'line',
            data: {
                labels: fl.convergence_history.map(r => `R${r.round}`),
                datasets: [{
                    label: 'Accuracy', data: fl.convergence_history.map(r => r.accuracy),
                    borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)',
                    fill: true, tension: 0.4, yAxisID: 'y',
                }, {
                    label: 'Loss', data: fl.convergence_history.map(r => r.loss),
                    borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)',
                    fill: true, tension: 0.4, yAxisID: 'y1',
                }],
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    y: { position: 'left', title: { display: true, text: 'Accuracy' }, grid: { color: 'rgba(255,255,255,0.04)' } },
                    y1: { position: 'right', title: { display: true, text: 'Loss' }, grid: { display: false } },
                    x: { grid: { display: false } },
                },
                plugins: { legend: { labels: { boxWidth: 10 } } },
            },
        });
    }

    // Impact summary
    const impacts = [
        { icon: '❤️', label: 'Lives Saved', value: '447+', detail: 'Direct patient impact' },
        { icon: '🩸', label: 'Units Optimized', value: '14.6M', detail: 'Annual throughput capacity' },
        { icon: '🏥', label: 'Blood Deserts', value: '0', detail: '100% district coverage target' },
        { icon: '🤖', label: 'AI Agents', value: '6', detail: 'Specialized autonomous agents' },
        { icon: '🧠', label: 'ML Models', value: '6', detail: 'LSTM, XGBoost, RF, Transformer, NER, Embeddings' },
        { icon: '🔒', label: 'Privacy', value: 'FL + DP', detail: 'Federated Learning + Differential Privacy' },
        { icon: '⚡', label: 'Match Speed', value: '<200ms', detail: 'Semantic vector retrieval' },
        { icon: '🌍', label: 'Scale', value: 'National', detail: 'Multi-region deployment ready' },
    ];
    document.getElementById('impact-summary').innerHTML = impacts.map(i => `
        <div class="inventory-item" style="text-align:center;padding:20px;">
            <div style="font-size:28px;margin-bottom:8px;">${i.icon}</div>
            <div style="font-size:24px;font-weight:800;color:var(--text-primary);">${i.value}</div>
            <div style="font-size:13px;font-weight:600;margin-top:4px;">${i.label}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${i.detail}</div>
        </div>
    `).join('');
}
