/**
 * HemoLink — SPA Router, State Manager, API Client
 * Core application logic powering the dashboard.
 */

const API_BASE = '';

// ── API Client ──
const api = {
    async get(endpoint) {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`);
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error(`API GET ${endpoint}:`, err);
            return null;
        }
    },
    async post(endpoint, data) {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error(`API POST ${endpoint}:`, err);
            return null;
        }
    }
};

// ── State ──
const state = {
    currentView: 'dashboard',
    donors: [],
    dashboardMetrics: null,
    agentStatuses: [],
    charts: {},
};

// ── Router ──
function navigateTo(view) {
    state.currentView = view;
    // Update nav
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`[data-view="${view}"]`);
    if (activeLink) activeLink.classList.add('active');
    // Update title
    const titles = {
        dashboard: 'Command Center',
        matching: 'AI Matching Engine',
        predictions: 'Predictive Intelligence',
        map: 'Geo-Spatial Routing',
        'digital-twin': 'Digital Twin Explorer',
        'blood-bank': 'Blood Bank & Hospital Registry',
        whatsapp: 'WhatsApp Agent Simulator',
        agents: 'Agent Hub',
        analytics: 'Impact Analytics',
    };
    document.getElementById('page-title').textContent = titles[view] || 'HemoLink';
    renderView(view);
}

function renderView(view) {
    const container = document.getElementById('view-container');
    container.innerHTML = '<div class="skeleton" style="height:400px;margin:20px 0;"></div>';
    switch (view) {
        case 'dashboard': renderDashboard(container); break;
        case 'matching': renderMatching(container); break;
        case 'predictions': renderPredictions(container); break;
        case 'map': renderMap(container); break;
        case 'digital-twin': renderDigitalTwin(container); break;
        case 'blood-bank': renderBloodBank(container); break;
        case 'whatsapp': renderWhatsAppAgent(container); break;
        case 'agents': renderAgentHub(container); break;
        case 'analytics': renderAnalytics(container); break;
    }
}

// ── Event Listeners ──
document.addEventListener('DOMContentLoaded', () => {
    // Nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.dataset.view);
        });
    });
    // Menu toggle
    document.getElementById('menu-toggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
    // Emergency modal
    document.getElementById('emergency-btn').addEventListener('click', () => {
        document.getElementById('emergency-modal').classList.remove('hidden');
    });
    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('emergency-modal').classList.add('hidden');
    });
    document.getElementById('em-submit').addEventListener('click', handleEmergency);
    // Notification panel
    document.getElementById('notification-bell').addEventListener('click', toggleNotifications);
    document.getElementById('close-notif').addEventListener('click', () => {
        document.getElementById('notification-panel').classList.add('hidden');
    });
    // Close modal on backdrop click
    document.getElementById('emergency-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
    });
    // Initial load
    loadNotifications();
    navigateTo('dashboard');
});

// ── Emergency Handler ──
async function handleEmergency() {
    const btn = document.getElementById('em-submit');
    btn.innerHTML = '⏳ AI Agents Working...';
    btn.disabled = true;
    
    const bloodType = document.getElementById('em-blood-type').value;
    const units = parseInt(document.getElementById('em-units').value);
    
    const data = {
        blood_type: bloodType,
        units_needed: units,
        urgency: document.getElementById('em-urgency').value,
        latitude: 12.9716,
        longitude: 77.5946,
    };
    
    // Call emergency orchestration match
    const result = await api.post('/api/matching/emergency', data);
    
    // Fetch blood banks with target blood group stock
    const banks = await api.get(`/api/blood-banks?blood_type=${bloodType}`);
    
    const container = document.getElementById('em-results');
    container.classList.remove('hidden');
    
    if (result && result.matching && result.matching.matches.length > 0) {
        let matchesHTML = result.matching.matches.slice(0, 5).map((m, i) => {
            const cleanPhone = m.phone ? m.phone.replace(/[^0-9]/g, '') : '';
            const waMsg = `EMERGENCY: Hi ${m.donor_name}, this is HemoLink. We need an urgent ${m.blood_type} donation at Victoria Hospital. Can you support?`;
            const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}`;
            return `
                <div class="match-card" style="animation:fadeIn 0.3s ease ${i * 0.1}s both; display:flex; flex-direction:column; gap:8px; padding:12px 16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <div>
                            <div style="font-weight:700;">#${i + 1} ${m.donor_name}</div>
                            <div style="font-size:12px;color:var(--text-muted);">${m.blood_type} · ${m.distance_km} km · ETA ${m.estimated_eta_minutes} min</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:18px;font-weight:800;color:var(--success);">${(m.match_score * 100).toFixed(0)}%</div>
                            <div style="font-size:10px;color:var(--text-muted);">match</div>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.03); padding-top:6px; font-size:11px;">
                        <span style="color:var(--text-muted);">📞 ${m.phone || 'N/A'}</span>
                        <div style="display:flex; gap:6px;">
                            <a href="tel:${m.phone}" class="tag tag-accent" style="padding:2px 8px; text-decoration:none;">📞 Call</a>
                            <a href="${waLink}" target="_blank" class="tag tag-primary" style="padding:2px 8px; background:rgba(34,197,94,0.1); color:#22c55e; border-color:rgba(34,197,94,0.2); text-decoration:none;">💬 WhatsApp</a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Find nearest bank that has inventory
        let bankHTML = '';
        if (banks && banks.length > 0) {
            // Pick first (closest or highest stock)
            const nearestBank = banks[0];
            const cleanBankPhone = nearestBank.contact_phone ? nearestBank.contact_phone.replace(/[^0-9]/g, '') : '';
            const bankWaLink = `https://wa.me/${cleanBankPhone}?text=Hi%20${encodeURIComponent(nearestBank.name)}%2C%20this%20is%20HemoLink.%20We%20need%20to%20requisition%20${units}%20units%20of%20${bloodType}.`;
            
            bankHTML = `
                <div style="margin-top:20px; border-top:1px dashed rgba(255,255,255,0.1); padding-top:16px;">
                    <h3 style="margin-bottom:12px;color:var(--accent-400); font-size:14px; font-weight:700;">🏥 Nearest Available Blood Bank</h3>
                    <div class="match-card" style="display:flex; flex-direction:column; gap:10px; padding:14px; background:rgba(20,184,166,0.05); border:1px solid rgba(20,184,166,0.15);">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <div>
                                <div style="font-weight:700; font-size:14px;">${nearestBank.name}</div>
                                <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">📍 ${nearestBank.address}</div>
                            </div>
                            <div class="tag tag-primary" style="font-size:11px;">Stock: ${nearestBank.inventory[bloodType]} units</div>
                        </div>
                        <div id="modal-req-status" style="display:none; font-size:12px; margin-top:4px;"></div>
                        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.03); padding-top:8px; font-size:11px;">
                            <span style="color:var(--text-muted);">📞 ${nearestBank.contact_phone}</span>
                            <div style="display:flex; gap:6px;">
                                <a href="tel:${nearestBank.contact_phone}" class="tag tag-accent" style="padding:2px 8px; text-decoration:none;">📞 Call</a>
                                <a href="${bankWaLink}" target="_blank" class="tag tag-primary" style="padding:2px 8px; background:rgba(34,197,94,0.1); color:#22c55e; border-color:rgba(34,197,94,0.2); text-decoration:none;">💬 WhatsApp</a>
                                <button onclick="triggerModalRequisition('${nearestBank.id}', '${bloodType}', ${units})" id="modal-req-btn" class="tag" style="padding:2px 8px; background:rgba(255,255,255,0.05); cursor:pointer;">📦 Request Stock</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            bankHTML = `
                <div style="margin-top:20px; border-top:1px dashed rgba(255,255,255,0.1); padding-top:16px;">
                    <p style="color:var(--text-muted); font-size:12px;">⚠️ No hospitals/blood banks currently report stock of ${bloodType}.</p>
                </div>
            `;
        }

        container.innerHTML = `
            <h3 style="margin-bottom:12px;color:var(--success);">✅ Compatible Donors Found</h3>
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">
                Processed in ${result.total_processing_time_ms?.toFixed(0) || '0'}ms by ${result.agents_invoked?.length || 3} AI agents
            </div>
            ${matchesHTML}
            ${bankHTML}
            <div class="reasoning-log" style="margin-top:16px;">
                ${(result.orchestrator_reasoning || []).map(r => `<div class="log-line">${r}</div>`).join('')}
            </div>
        `;
    } else {
        container.innerHTML = '<p style="color:var(--warning);">⚠️ No matches found. Try expanding search radius.</p>';
    }
    
    btn.innerHTML = '⚡ Activate AI Orchestration';
    btn.disabled = false;
}

// Global helper for modal requisitions
window.triggerModalRequisition = async function(bankId, bloodType, units) {
    const reqBtn = document.getElementById('modal-req-btn');
    const statusDiv = document.getElementById('modal-req-status');
    
    reqBtn.disabled = true;
    reqBtn.innerText = '⏳ Requesting...';
    
    const res = await api.post('/api/blood-banks/request', {
        bank_id: bankId,
        blood_type: bloodType,
        units_requested: units
    });
    
    statusDiv.style.display = 'block';
    if (res && res.status === 'success') {
        statusDiv.innerHTML = `
            <div style="padding:8px 12px; background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.3); border-radius:6px; color:#22c55e;">
                ✅ Requisition Approved! ${units} units requested from facility. Remaining stock: ${res.remaining_stock} units.
            </div>
        `;
        reqBtn.style.display = 'none';
    } else {
        statusDiv.innerHTML = `
            <div style="padding:8px 12px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:6px; color:var(--danger);">
                ⚠️ Request rejected. Stock low or unavailable.
            </div>
        `;
        reqBtn.innerText = '📦 Request Stock';
        reqBtn.disabled = false;
    }
};

// ── Notifications ──
function toggleNotifications() {
    document.getElementById('notification-panel').classList.toggle('hidden');
}

async function loadNotifications() {
    const data = await api.get('/api/predictions/shortages');
    const list = document.getElementById('notif-list');
    if (!data || !data.alerts) {
        list.innerHTML = '<div class="notif-item low"><div class="notif-title">All clear</div></div>';
        return;
    }
    const alerts = data.alerts.filter(a => a.risk_level !== 'low').slice(0, 6);
    document.getElementById('notif-count').textContent = alerts.length;
    list.innerHTML = alerts.map(a => `
        <div class="notif-item ${a.risk_level}">
            <div class="notif-title">${a.risk_level === 'critical' ? '🔴' : a.risk_level === 'high' ? '🟠' : '🔵'} ${a.blood_type} — ${a.risk_level.toUpperCase()}</div>
            <div class="notif-desc">${a.recommended_action}</div>
            <div class="notif-time">Stock: ${a.current_stock} units · Demand 7d: ${a.predicted_demand_7d}</div>
        </div>
    `).join('');
}

// ── Utilities ──
function destroyCharts() {
    Object.values(state.charts).forEach(c => { try { c.destroy(); } catch(e) {} });
    state.charts = {};
}

function animateValue(el, start, end, duration = 1000) {
    const range = end - start;
    const startTime = performance.now();
    function step(timestamp) {
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + range * eased;
        el.textContent = Number.isInteger(end) ? Math.round(current) : current.toFixed(1);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

Chart.defaults.color = '#a1a1b5';
Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
Chart.defaults.font.family = "'Inter', sans-serif";
