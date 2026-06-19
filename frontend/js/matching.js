/**
 * HemoLink Matching — AI Matching Engine View
 */

async function renderMatching(container) {
    destroyCharts();
    container.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">🔍 Semantic Donor Matching</div>
                <div class="section-subtitle">Multi-factor AI matching: ABO compatibility → Vector similarity → Geo-proximity → Reliability</div>
            </div>
        </div>

        <div class="content-grid">
            <div class="card-section glass-card">
                <div class="card-section-title">Search Parameters</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="match-bt">Blood Type Needed</label>
                        <select id="match-bt" class="form-select">
                            <option value="O-">O-</option><option value="O+" selected>O+</option>
                            <option value="A+">A+</option><option value="A-">A-</option>
                            <option value="B+">B+</option><option value="B-">B-</option>
                            <option value="AB+">AB+</option><option value="AB-">AB-</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="match-urgency">Urgency</label>
                        <select id="match-urgency" class="form-select">
                            <option value="critical">🔴 Critical</option>
                            <option value="urgent">🟠 Urgent</option>
                            <option value="normal" selected>🟡 Normal</option>
                            <option value="scheduled">🟢 Scheduled</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="match-radius">Max Distance (km)</label>
                        <input type="number" id="match-radius" value="30" class="form-input">
                    </div>
                    <div class="form-group">
                        <label for="match-units">Units</label>
                        <input type="number" id="match-units" value="2" class="form-input">
                    </div>
                </div>
                <button id="run-match" class="btn btn-primary btn-full">⚡ Run AI Matching</button>
            </div>
            <div class="card-section glass-card">
                <div class="card-section-title">Matching Pipeline</div>
                <div class="pipeline-steps">
                    <div class="pipeline-step complete">✅ ABO Filter</div>
                    <span class="pipeline-arrow">→</span>
                    <div class="pipeline-step complete">✅ Vector Search</div>
                    <span class="pipeline-arrow">→</span>
                    <div class="pipeline-step complete">✅ Geo-Proximity</div>
                    <span class="pipeline-arrow">→</span>
                    <div class="pipeline-step complete">✅ Reliability</div>
                    <span class="pipeline-arrow">→</span>
                    <div class="pipeline-step complete">✅ Re-Rank</div>
                </div>
                <div style="margin-top:16px;">
                    <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">Scoring Weights (by urgency)</div>
                    <div id="weight-display" style="font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);line-height:1.8;"></div>
                </div>
            </div>
        </div>

        <div id="match-results" class="content-grid full-width" style="display:none;">
            <div class="card-section glass-card">
                <div class="card-section-title" id="match-results-title">Results</div>
                <div id="match-list" class="match-list"></div>
                <div class="reasoning-log" id="match-reasoning" style="margin-top:16px;"></div>
            </div>
        </div>

        <div class="content-grid full-width">
            <div class="card-section glass-card">
                <div class="card-section-title">📊 Vector Store Statistics</div>
                <div id="vs-stats" style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;"></div>
            </div>
        </div>
    `;

    // Weight display
    updateWeightDisplay('normal');
    document.getElementById('match-urgency').addEventListener('change', (e) => {
        updateWeightDisplay(e.target.value);
    });

    // Run match
    document.getElementById('run-match').addEventListener('click', runMatch);

    // Vector store stats
    const stats = await api.get('/api/analytics/vector-store/stats');
    if (stats) {
        document.getElementById('vs-stats').innerHTML = Object.entries(stats).map(([k, v]) => `
            <div class="inventory-item">
                <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;">${k.replace(/_/g, ' ')}</div>
                <div style="font-size:18px;font-weight:700;margin-top:4px;">${v}</div>
            </div>
        `).join('');
    }
}

function updateWeightDisplay(urgency) {
    const weights = {
        critical: { compatibility: 0.35, proximity: 0.30, reliability: 0.20, availability: 0.15 },
        urgent: { compatibility: 0.30, proximity: 0.25, reliability: 0.25, availability: 0.20 },
        normal: { compatibility: 0.25, proximity: 0.20, reliability: 0.30, availability: 0.25 },
        scheduled: { compatibility: 0.20, proximity: 0.15, reliability: 0.35, availability: 0.30 },
    };
    const w = weights[urgency] || weights.normal;
    const el = document.getElementById('weight-display');
    if (el) {
        el.innerHTML = Object.entries(w).map(([k, v]) => {
            const pct = (v * 100).toFixed(0);
            const color = k === 'compatibility' ? 'var(--primary-400)' : k === 'proximity' ? 'var(--info)' : k === 'reliability' ? 'var(--accent-400)' : 'var(--warning)';
            return `<div>${k}: <span style="color:${color};font-weight:700;">${pct}%</span> <span style="display:inline-block;width:${pct * 2}px;height:6px;background:${color};border-radius:3px;vertical-align:middle;"></span></div>`;
        }).join('');
    }
}

async function runMatch() {
    const btn = document.getElementById('run-match');
    btn.innerHTML = '⏳ Agents processing...';
    btn.disabled = true;

    const data = {
        blood_type: document.getElementById('match-bt').value,
        urgency: document.getElementById('match-urgency').value,
        max_distance_km: parseFloat(document.getElementById('match-radius').value),
        units_needed: parseInt(document.getElementById('match-units').value),
        latitude: 12.9716, longitude: 77.5946,
    };

    const result = await api.post('/api/matching/find', data);
    const resultsDiv = document.getElementById('match-results');
    resultsDiv.style.display = 'block';

    if (result?.matches?.length) {
        document.getElementById('match-results-title').textContent =
            `✅ ${result.matches.length} Matches Found (${result.processing_time_ms?.toFixed(0)}ms)`;

        document.getElementById('match-list').innerHTML = result.matches.map((m, i) => {
            const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-other';
            const scoreColor = m.match_score > 0.7 ? 'var(--success)' : m.match_score > 0.4 ? 'var(--warning)' : 'var(--danger)';
            const cleanPhone = m.phone ? m.phone.replace(/[^0-9]/g, '') : '';
            const waMsg = `Hi ${m.donor_name}, this is HemoLink. We have an urgent emergency request for a ${m.blood_type} blood donation near you. Can you support?`;
            const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}`;
            
            return `
                <div class="match-card" style="animation:slideInUp 0.3s ease ${i * 0.08}s both; display:flex; flex-direction:column; align-items:stretch; gap:12px;">
                    <div style="display:flex; align-items:center; gap:16px;">
                        <div class="match-rank ${rankClass}">${i + 1}</div>
                        <div class="match-info">
                            <div class="match-name">${m.donor_name}</div>
                            <div class="match-details">
                                <span class="tag tag-primary">${m.blood_type}</span>
                                <span style="margin-left:8px;">📍 ${m.distance_km} km</span>
                                <span style="margin-left:8px;">⏱️ ETA: ${m.estimated_eta_minutes} min</span>
                            </div>
                        </div>
                        <div style="display:flex;gap:12px;align-items:center;margin-left:auto;">
                            <div style="text-align:center;">
                                <div style="font-size:10px;color:var(--text-muted);">Compat</div>
                                <div style="font-weight:700;font-size:13px;">${(m.compatibility_score * 100).toFixed(0)}%</div>
                            </div>
                            <div style="text-align:center;">
                                <div style="font-size:10px;color:var(--text-muted);">Reliab</div>
                                <div style="font-weight:700;font-size:13px;">${(m.reliability_score * 100).toFixed(0)}%</div>
                            </div>
                            <div class="match-score">
                                <div class="match-score-value" style="color:${scoreColor};">${(m.match_score * 100).toFixed(0)}%</div>
                                <div class="match-score-label">overall</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Direct Contact Bar -->
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.04); padding-top:10px; font-size:12px;">
                        <div style="color:var(--text-muted); display:flex; gap:16px;">
                            <span>📞 <strong>${m.phone || 'N/A'}</strong></span>
                            <span>✉️ <strong>${m.email || 'N/A'}</strong></span>
                        </div>
                        <div style="display:flex; gap:8px;">
                            <a href="tel:${m.phone}" class="tag tag-accent" style="text-decoration:none; cursor:pointer;">📞 Call Now</a>
                            <a href="${waLink}" target="_blank" class="tag tag-primary" style="background:rgba(34,197,94,0.1); color:#22c55e; border-color:rgba(34,197,94,0.2); text-decoration:none;">💬 WhatsApp</a>
                            <a href="mailto:${m.email}?subject=HemoLink%20Emergency%20Donation&body=${encodeURIComponent(waMsg)}" class="tag" style="text-decoration:none;">✉️ Email</a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('match-reasoning').innerHTML =
            (result.agent_reasoning || []).map(r => `<div class="log-line">${r}</div>`).join('');
    } else {
        document.getElementById('match-list').innerHTML =
            '<div style="padding:20px;text-align:center;color:var(--warning);">No compatible donors found in range.</div>';
    }

    btn.innerHTML = '⚡ Run AI Matching';
    btn.disabled = false;
}
