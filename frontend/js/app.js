/**
 * HemoLink — SPA Router, State Manager, API Client
 * Core application logic powering the dashboard.
 */

// ── API Client with Auto-Mock Fallback (for static deployment like GitHub Pages) ──
const isStaticHost = window.location.hostname.includes('github.io') || window.location.protocol === 'file:';

const mockDb = {
    getRoutingNetwork() {
        return {
            total_nodes: 16, total_edges: 23, city: "Bangalore",
            nodes: [
                { name: "koramangala", lat: 12.9352, lng: 77.6245 },
                { name: "indiranagar", lat: 12.9784, lng: 77.6408 },
                { name: "whitefield", lat: 12.9698, lng: 77.7500 },
                { name: "electronic_city", lat: 12.8399, lng: 77.6770 },
                { name: "jayanagar", lat: 12.9300, lng: 77.5838 },
                { name: "malleshwaram", lat: 12.9969, lng: 77.5700 },
                { name: "hebbal", lat: 13.0358, lng: 77.5970 },
                { name: "btm_layout", lat: 12.9166, lng: 77.6101 },
                { name: "hsr_layout", lat: 12.9116, lng: 77.6389 },
                { name: "marathahalli", lat: 12.9591, lng: 77.7009 },
                { name: "mg_road", lat: 12.9757, lng: 77.6063 },
                { name: "central", lat: 12.9716, lng: 77.5946 },
                { name: "yelahanka", lat: 13.1007, lng: 77.5963 },
                { name: "bannerghatta", lat: 12.8700, lng: 77.5964 },
                { name: "kr_puram", lat: 13.0098, lng: 77.6960 },
                { name: "jp_nagar", lat: 12.9063, lng: 77.5857 }
            ]
        };
    },
    getBloodBanks() {
        return [
            { id: "victoria", name: "Victoria Hospital Blood Bank", latitude: 12.9645, longitude: 77.5760, contact_phone: "+918026701111", inventory: { "O+": 45, "O-": 12, "B+": 28, "A+": 32, "AB+": 10, "A-": 4, "B-": 6, "AB-": 2 } },
            { id: "st_johns", name: "St. John's Medical College Hospital", latitude: 12.9322, longitude: 77.6244, contact_phone: "+918022065000", inventory: { "O+": 38, "O-": 8, "B+": 42, "A+": 25, "AB+": 15, "A-": 3, "B-": 5, "AB-": 1 } },
            { id: "rotary", name: "Rotary Bangalore TTK Blood Bank", latitude: 12.9784, longitude: 77.6408, contact_phone: "+918025287903", inventory: { "O+": 60, "O-": 15, "B+": 55, "A+": 40, "AB+": 18, "A-": 8, "B-": 12, "AB-": 4 } },
            { id: "red_cross", name: "Red Cross Society Blood Bank", latitude: 12.9757, longitude: 77.6063, contact_phone: "+918022268435", inventory: { "O+": 30, "O-": 6, "B+": 35, "A+": 22, "AB+": 8, "A-": 2, "B-": 4, "AB-": 2 } },
            { id: "rashtrotthana", name: "Rashtrotthana Blood Bank", latitude: 12.9300, longitude: 77.5838, contact_phone: "+918026612730", inventory: { "O+": 52, "O-": 10, "B+": 48, "A+": 35, "AB+": 12, "A-": 5, "B-": 8, "AB-": 3 } }
        ];
    },
    findRoute(olat, olng, dlat, dlng) {
        const d = Math.sqrt(Math.pow(olat - dlat, 2) + Math.pow(olng - dlng, 2)) * 111;
        const speed = 30.0;
        const eta = (d / speed) * 60;
        return {
            distance_km: parseFloat(d.toFixed(2)),
            estimated_time_minutes: parseFloat(eta.toFixed(1)),
            path: [
                { name: "Origin", lat: olat, lng: olng },
                { name: "Transit Point", lat: (olat + dlat) / 2, lng: (olng + dlng) / 2 },
                { name: "Destination", lat: dlat, lng: dlng }
            ],
            algorithm_used: "A* Search",
            optimization_notes: ["Static Mock Route calculated based on coordinate distances."]
        };
    },
    getShortages() {
        return {
            inventory: { "A+": 45, "A-": 8, "B+": 52, "B-": 5, "AB+": 12, "AB-": 2, "O+": 65, "O-": 7 },
            alerts: [
                { blood_type: "O-", risk_level: "critical", reason: "Historical demand spike + low stock" },
                { blood_type: "AB-", risk_level: "critical", reason: "Critical supply level (< 3 units)" },
                { blood_type: "B-", risk_level: "high", reason: "Decreasing donation trend" },
                { blood_type: "A-", risk_level: "high", reason: "High usage forecast in next 48h" }
            ]
        };
    },
    findMatches(bloodType) {
        return {
            matches: [
                { donor_name: "Amit Joshi", match_score: 0.94, distance_km: 1.2, phone: "+919931757575", blood_type: bloodType || "O+" },
                { donor_name: "Ananya Sharma", match_score: 0.89, distance_km: 5.5, phone: "+919105768679", blood_type: bloodType || "O+" },
                { donor_name: "Kavitha Rao", match_score: 0.87, distance_km: 6.5, phone: "+919758556292", blood_type: bloodType || "O+" }
            ]
        };
    },
    getDashboardMetrics() {
        return {
            total_donors: 142, active_donors: 98, total_requests: 156, pending_requests: 3, fulfilled_requests: 149,
            avg_match_time_minutes: 4.2, avg_fulfillment_time_minutes: 18.7, total_donations_today: 12,
            blood_inventory: { "A+": 45, "A-": 8, "B+": 52, "B-": 5, "AB+": 12, "AB-": 2, "O+": 65, "O-": 7 },
            shortage_alerts: 4, donor_churn_rate: 0.18, system_health: 0.97, lives_saved_estimate: 447,
            wastage_reduction_pct: 42.3, response_time_improvement_pct: 83
        };
    },
    getAgentStatuses() {
        return {
            agents: [
                { name: "Orchestrator Agent", status: "Active", task: "Monitoring system events & queues" },
                { name: "Matching Agent", status: "Idle", task: "Waiting for matching request" },
                { name: "Prediction Agent", status: "Active", task: "Forecasting stock depletion rates" },
                { name: "Engagement Agent", status: "Idle", task: "Analyzing donor churn profiles" }
            ]
        };
    },
    getocr() {
        return {
            confidence_score: 0.96,
            extracted_entities: {
                patient_name: "Karan Verma",
                blood_group: "B+",
                hemoglobin: "14.2",
                age: "29",
                gender: "Male"
            }
        };
    },
    getrag(q) {
        return {
            answer: `Based onNBTC guidelines, to donate blood you must be between 18 and 65 years old, weigh at least 45 kg, and have a hemoglobin level above 12.5 g/dL. (Answered in static demo mode for query: "${q}")`,
            sources: [{ title: "National Blood Transfusion Council Guidelines" }, { title: "WHO Blood Donation Manual" }]
        };
    }
};

const API_BASE = '';
const api = {
    async get(endpoint) {
        if (isStaticHost) return this.mockGet(endpoint);
        try {
            const res = await fetch(`${API_BASE}${endpoint}`);
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.warn(`API GET ${endpoint} failed, falling back to mock data:`, err);
            return this.mockGet(endpoint);
        }
    },
    async post(endpoint, data) {
        if (isStaticHost) return this.mockPost(endpoint, data);
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.warn(`API POST ${endpoint} failed, falling back to mock data:`, err);
            return this.mockPost(endpoint, data);
        }
    },
    mockGet(endpoint) {
        if (endpoint.includes('/api/analytics/routing/network')) return mockDb.getRoutingNetwork();
        if (endpoint.includes('/api/blood-banks')) return mockDb.getBloodBanks();
        if (endpoint.includes('/api/predictions/shortages')) return mockDb.getShortages();
        if (endpoint.includes('/api/analytics/dashboard')) return mockDb.getDashboardMetrics();
        if (endpoint.includes('/api/analytics/agents')) return mockDb.getAgentStatuses();
        if (endpoint.includes('/api/analytics/ocr/process')) return mockDb.getocr();
        if (endpoint.includes('/api/analytics/rag/query')) {
            const urlParams = new URLSearchParams(endpoint.split('?')[1]);
            return mockDb.getrag(urlParams.get('q'));
        }
        if (endpoint.includes('/api/predictions/forecast')) {
            const parts = endpoint.split('/');
            const bt = parts[parts.length - 1].split('?')[0];
            return {
                blood_type: bt,
                forecast: Array.from({ length: 30 }, (_, i) => ({
                    day: i + 1,
                    actual: i < 15 ? 40 + Math.sin(i / 2) * 8 + Math.random() * 4 : null,
                    predicted: 40 + Math.sin(i / 2) * 8 + Math.random() * 4
                }))
            };
        }
        if (endpoint.includes('/api/predictions/risk-scores')) {
            return { risk_scores: { "O-": 0.92, "AB-": 0.88, "B-": 0.65, "A-": 0.58, "AB+": 0.15, "A+": 0.12, "O+": 0.08, "B+": 0.05 } };
        }
        if (endpoint.includes('/api/predictions/model-performance')) {
            return { mae: 1.45, rmse: 2.12, accuracy: 0.945, r2: 0.89 };
        }
        if (endpoint.includes('/api/donors/?limit=')) {
            return Array.from({ length: 15 }, (_, i) => ({
                id: `donor_${i}`,
                donor_name: ["Amit Joshi", "Ananya Sharma", "Kavitha Rao", "Rohan Das", "Sneha Patel", "Vikram Sen", "Priya Nair", "Suresh Kumar", "Meera Pillai", "Rahul Roy"][i % 10],
                blood_group: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"][i % 8],
                phone: `+9198450${10000 + i}`,
                is_active: true,
                last_donation_date: "2026-03-12"
            }));
        }
        if (endpoint.includes('/digital-twin')) {
            return {
                donor_id: "donor_0",
                personalized_prediction: { next_eligible_date: "2026-09-12", donation_probability: 0.85 },
                risk_of_churn: 0.12, engagement_score: 94
            };
        }
        if (endpoint.includes('/api/analytics/routing/find')) {
            const urlParams = new URLSearchParams(endpoint.split('?')[1]);
            return mockDb.findRoute(
                parseFloat(urlParams.get('olat')), parseFloat(urlParams.get('olng')),
                parseFloat(urlParams.get('dlat')), parseFloat(urlParams.get('dlng'))
            );
        }
        if (endpoint.includes('/api/whatsapp/logs')) {
            return { logs: [] };
        }
        return null;
    },
    mockPost(endpoint, data) {
        if (endpoint.includes('/api/matching/find')) {
            return mockDb.findMatches(data.blood_type);
        }
        if (endpoint.includes('/api/matching/emergency')) {
            return { status: "success", matched_count: 3 };
        }
        if (endpoint.includes('/api/blood-banks/request')) {
            return { status: "success", request_id: "REQ_" + Math.random().toString(36).substr(2, 9) };
        }
        if (endpoint.includes('/api/whatsapp/logs/clear')) {
            return { status: "success" };
        }
        return { status: "success" };
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
        map: 'Blood Warrior Dispatch',
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
    if (window.waLogInterval) {
        clearInterval(window.waLogInterval);
        window.waLogInterval = null;
    }
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
