/**
 * HemoLink WhatsApp Agent — Meta WhatsApp Cloud API Integration
 * Uses Meta Business Platform (like Namma Metro, IRCTC, etc.)
 */

let waState = { step: 'menu', history: [] };

window.triggerWaButton = function(val) {
    const input = document.getElementById('wa-input');
    if (input) { input.value = val; document.getElementById('wa-send')?.click(); }
};

function renderWhatsAppAgent(container) {
    if (window.waLogInterval) { clearInterval(window.waLogInterval); window.waLogInterval = null; }
    destroyCharts();

    container.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">💬 WhatsApp Business Agent</div>
                <div class="section-subtitle">HemoLink's automated chatbot powered by Meta WhatsApp Cloud API — like Namma Metro, IRCTC & MyGov bots</div>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 380px; gap:24px; max-width:1200px; margin:0 auto;">
            <!-- Left: Architecture + Live Logs -->
            <div style="display:flex; flex-direction:column; gap:20px;">

                <!-- How it works — Architecture -->
                <div class="glass-card card-section">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <div class="card-section-title" style="margin-bottom:0;">🏗️ WhatsApp Cloud API Architecture</div>
                        <span class="tag tag-primary">Meta Business Platform</span>
                    </div>
                    <p style="color:var(--text-secondary);font-size:12px;margin-bottom:14px;line-height:1.5;">
                        HemoLink uses the <strong>Meta WhatsApp Business Cloud API</strong> — the same technology powering
                        <strong>Namma Metro</strong>, <strong>IRCTC</strong>, <strong>MyGov India</strong>, and <strong>BBMP Sahaaya</strong> bots.
                        Messages from users are received via webhook, processed by our AI agents, and replies are sent back through Meta's API.
                    </p>
                    <!-- Architecture Flow Diagram -->
                    <div style="display:flex;align-items:center;gap:0;background:rgba(0,0,0,0.15);border-radius:10px;padding:14px 10px;border:1px solid rgba(255,255,255,0.04);overflow-x:auto;">
                        <div style="text-align:center;min-width:70px;">
                            <div style="font-size:24px;">📱</div>
                            <div style="font-size:9px;font-weight:700;color:var(--text-primary);margin-top:4px;">User Phone</div>
                            <div style="font-size:8px;color:var(--text-muted);">WhatsApp</div>
                        </div>
                        <div style="color:var(--accent-400);font-size:14px;padding:0 6px;">➤</div>
                        <div style="text-align:center;min-width:80px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.15);border-radius:6px;padding:8px 6px;">
                            <div style="font-size:20px;">💬</div>
                            <div style="font-size:9px;font-weight:700;color:#22c55e;margin-top:4px;">Meta Cloud API</div>
                            <div style="font-size:8px;color:var(--text-muted);">graph.facebook.com</div>
                        </div>
                        <div style="color:var(--accent-400);font-size:14px;padding:0 6px;">➤</div>
                        <div style="text-align:center;min-width:80px;background:rgba(255,77,109,0.08);border:1px solid rgba(255,77,109,0.15);border-radius:6px;padding:8px 6px;">
                            <div style="font-size:20px;">🧠</div>
                            <div style="font-size:9px;font-weight:700;color:var(--primary-400);margin-top:4px;">HemoLink Webhook</div>
                            <div style="font-size:8px;color:var(--text-muted);">/api/whatsapp/webhook</div>
                        </div>
                        <div style="color:var(--accent-400);font-size:14px;padding:0 6px;">➤</div>
                        <div style="text-align:center;min-width:80px;background:rgba(96,165,250,0.08);border:1px solid rgba(96,165,250,0.15);border-radius:6px;padding:8px 6px;">
                            <div style="font-size:20px;">🤖</div>
                            <div style="font-size:9px;font-weight:700;color:#60a5fa;margin-top:4px;">AI Agents</div>
                            <div style="font-size:8px;color:var(--text-muted);">Match · RAG · Predict</div>
                        </div>
                        <div style="color:var(--accent-400);font-size:14px;padding:0 6px;">➤</div>
                        <div style="text-align:center;min-width:70px;">
                            <div style="font-size:24px;">📱</div>
                            <div style="font-size:9px;font-weight:700;color:var(--text-primary);margin-top:4px;">Reply</div>
                            <div style="font-size:8px;color:var(--text-muted);">To User</div>
                        </div>
                    </div>
                </div>

                <!-- Setup Guide -->
                <div class="glass-card card-section">
                    <div class="card-section-title">🔧 Production Deployment Guide</div>
                    <div style="display:flex;flex-direction:column;gap:10px;font-size:12px;color:var(--text-secondary);">
                        <div style="display:flex;gap:10px;align-items:flex-start;">
                            <span style="background:var(--primary-400);color:#fff;font-size:10px;font-weight:800;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</span>
                            <div><strong>Register on Meta for Developers</strong> → Create a Business App at <code style="background:rgba(255,255,255,0.06);padding:1px 4px;border-radius:3px;font-size:11px;">developers.facebook.com</code></div>
                        </div>
                        <div style="display:flex;gap:10px;align-items:flex-start;">
                            <span style="background:var(--primary-400);color:#fff;font-size:10px;font-weight:800;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</span>
                            <div><strong>Add WhatsApp Product</strong> → Get your <strong>Phone Number ID</strong> and <strong>Access Token</strong></div>
                        </div>
                        <div style="display:flex;gap:10px;align-items:flex-start;">
                            <span style="background:var(--primary-400);color:#fff;font-size:10px;font-weight:800;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</span>
                            <div><strong>Set Webhook URL</strong> → Point to <code style="background:rgba(255,255,255,0.06);padding:1px 4px;border-radius:3px;font-size:11px;">https://your-domain.com/api/whatsapp/webhook</code></div>
                        </div>
                        <div style="display:flex;gap:10px;align-items:flex-start;">
                            <span style="background:var(--primary-400);color:#fff;font-size:10px;font-weight:800;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">4</span>
                            <div><strong>Set env variables</strong> → <code style="background:rgba(255,255,255,0.06);padding:1px 4px;border-radius:3px;font-size:11px;">WHATSAPP_TOKEN</code> and <code style="background:rgba(255,255,255,0.06);padding:1px 4px;border-radius:3px;font-size:11px;">PHONE_NUMBER_ID</code> in your server</div>
                        </div>
                        <div style="display:flex;gap:10px;align-items:flex-start;">
                            <span style="background:#22c55e;color:#fff;font-size:10px;font-weight:800;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">✓</span>
                            <div><strong>Go Live!</strong> → Users message your WhatsApp Business number and the bot responds automatically</div>
                        </div>
                    </div>
                </div>

                <!-- Webhook Logs -->
                <div class="glass-card card-section" style="flex:1;display:flex;flex-direction:column;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                        <div class="card-section-title" style="margin-bottom:0;">📊 Webhook Message Log</div>
                        <button id="clear-web-logs" class="tag" style="background:rgba(239,68,68,0.1);color:#ef4444;border-color:rgba(239,68,68,0.2);cursor:pointer;">🗑️ Clear</button>
                    </div>
                    <div id="wa-web-logs" style="flex:1;min-height:150px;overflow-y:auto;font-family:var(--font-mono);font-size:11px;background:rgba(0,0,0,0.15);padding:10px;border-radius:6px;border:1px solid rgba(255,255,255,0.04);">
                        <div style="color:var(--text-muted);text-align:center;padding-top:30px;">Webhook logs will appear here when messages are received.<br>Use the simulator on the right to test locally →</div>
                    </div>
                </div>
            </div>

            <!-- Right: Chat Simulator -->
            <div class="phone-wrapper glass-card" style="align-self:start;">
                <div class="phone-screen">
                    <div class="wa-header">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <span style="font-size:20px;">🩸</span>
                            <div>
                                <div style="font-weight:700;font-size:14px;">HemoLink</div>
                                <div style="font-size:10px;color:rgba(255,255,255,0.7);display:flex;align-items:center;gap:4px;">
                                    <span style="display:inline-block;width:6px;height:6px;background:#22c55e;border-radius:50%;"></span> Business Account
                                </div>
                            </div>
                        </div>
                        <div style="font-size:11px;color:rgba(255,255,255,0.8);cursor:pointer;background:rgba(255,255,255,0.1);padding:2px 8px;border-radius:4px;" onclick="triggerWaButton('hi')">🔄</div>
                    </div>
                    <div class="wa-chat-body" id="wa-chat-body"></div>
                    <div class="wa-input-area">
                        <input type="text" id="wa-input" placeholder="Type a message..." class="wa-input-field">
                        <button id="wa-send" class="wa-send-btn">➔</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (waState.history.length === 0) sendMenuMessage(); else renderHistory();
    document.getElementById('wa-input').addEventListener('keypress', e => { if (e.key === 'Enter') handleSend(); });
    document.getElementById('wa-send').addEventListener('click', handleSend);
    document.getElementById('clear-web-logs').addEventListener('click', async () => {
        await api.post('/api/whatsapp/logs/clear');
        document.getElementById('wa-web-logs').innerHTML = '<div style="color:var(--text-muted);text-align:center;padding-top:30px;">Logs cleared.</div>';
    });

    async function fetchWebhookLogs() {
        const res = await api.get('/api/whatsapp/logs');
        const el = document.getElementById('wa-web-logs');
        if (!el || !res || !res.logs || res.logs.length === 0) return;
        el.innerHTML = res.logs.map(l => `
            <div style="border-bottom:1px solid rgba(255,255,255,0.03);padding:6px 0;">
                <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);margin-bottom:2px;">
                    <span style="color:var(--accent-400);">📱 ${l.from}</span><span>⏱️ ${l.timestamp}</span>
                </div>
                <div style="color:var(--text-primary);margin-bottom:3px;">📥 <strong>User:</strong> ${l.body}</div>
                <div style="color:var(--text-secondary);background:rgba(255,255,255,0.02);padding:4px 8px;border-radius:4px;font-size:10px;border-left:2px solid var(--primary-400);">
                    🤖 ${l.reply.replace(/\\n/g,'<br>').replace(/\n/g,'<br>')}
                </div>
            </div>
        `).join('');
        el.scrollTop = el.scrollHeight;
    }
    fetchWebhookLogs();
    window.waLogInterval = setInterval(fetchWebhookLogs, 3000);
}

function sendMenuMessage() {
    addBotMessage("Hi! I'm the *HemoLink AI Assistant* 🩸\n\nI can help you with:\n\n1️⃣ Find compatible donors\n2️⃣ Check blood stock levels\n3️⃣ Safety & compliance guidelines\n4️⃣ Scan blood report (OCR)\n\nTap an option below or type the number:", [
        { label: '🩸 Find Donors', value: '1' }, { label: '📊 Blood Stock', value: '2' },
        { label: '📚 Safety Guidelines', value: '3' }, { label: '📄 Scan Report', value: '4' }
    ]);
}

function addBotMessage(text, buttons = []) { const m = { sender: 'bot', text, buttons, time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) }; waState.history.push(m); appendMessageHTML(m); }
function addUserMessage(text) { const m = { sender: 'user', text, time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) }; waState.history.push(m); appendMessageHTML(m); }

function appendMessageHTML(msg) {
    const body = document.getElementById('wa-chat-body'); if (!body) return;
    const div = document.createElement('div');
    div.className = `wa-msg ${msg.sender === 'user' ? 'wa-msg-user' : 'wa-msg-bot'}`;
    let text = msg.text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
    let btns = '';
    if (msg.buttons && msg.buttons.length > 0) {
        btns = `<div style="display:flex;flex-direction:column;gap:5px;margin-top:8px;border-top:1px solid rgba(255,255,255,0.06);padding-top:6px;">
            ${msg.buttons.map(b => `<button class="wa-chat-btn" onclick="triggerWaButton('${b.value}')" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:5px 10px;color:var(--accent-400);font-size:11px;text-align:left;cursor:pointer;font-weight:600;display:flex;align-items:center;justify-content:space-between;transition:background 0.2s;"><span>${b.label}</span><span>➔</span></button>`).join('')}
        </div>`;
    }
    div.innerHTML = `<div class="wa-msg-bubble" style="width:100%;"><div class="wa-msg-text">${text}</div>${btns}<div class="wa-msg-time">${msg.time}</div></div>`;
    body.appendChild(div); body.scrollTop = body.scrollHeight;
}

function renderHistory() { const b = document.getElementById('wa-chat-body'); if (!b) return; b.innerHTML = ''; waState.history.forEach(appendMessageHTML); }
async function handleSend() { const i = document.getElementById('wa-input'); const t = i.value.trim(); if (!t) return; addUserMessage(t); i.value = ''; setTimeout(async () => { await processInput(t); }, 500); }

async function processInput(text) {
    const c = text.toLowerCase().trim();
    if (['hi','hello','menu','reset'].includes(c)) { waState.step = 'menu'; sendMenuMessage(); return; }

    if (waState.step === 'menu') {
        if (c === '1' || c.includes('donor')) {
            waState.step = 'wait_blood_type';
            addBotMessage("Please select the blood type needed:", [
                {label:'🩸 O+',value:'O+'},{label:'🩸 O-',value:'O-'},{label:'🩸 B+',value:'B+'},
                {label:'🩸 A+',value:'A+'},{label:'🩸 AB+',value:'AB+'}
            ]);
        } else if (c === '2' || c.includes('stock')) {
            const data = await api.get('/api/predictions/shortages');
            if (data && data.alerts) {
                let s = "📊 *Current Blood Stock*\n\n";
                Object.entries(data.inventory).forEach(([bt,n]) => { s += `• *${bt}*: ${n} units ${n<10?'🚨':'✅'}\n`; });
                addBotMessage(s, [{label:'🏠 Main Menu',value:'hi'}]);
            }
        } else if (c === '3' || c.includes('safety') || c.includes('guideline')) {
            waState.step = 'wait_rag';
            addBotMessage("Ask me anything about blood donation safety, eligibility, or compliance:", [
                {label:'📚 Universal donor?',value:'Who is the universal donor?'},
                {label:'📚 Age limit?',value:'What is the age limit for donation?'},
                {label:'📚 Storage duration?',value:'How long can blood be stored?'}
            ]);
        } else if (c === '4' || c.includes('scan') || c.includes('ocr')) {
            const ocr = await api.get('/api/analytics/ocr/process?doc_type=blood_report');
            if (ocr) {
                const e = ocr.extracted_entities;
                addBotMessage(`📄 *Lab Report Digitized*\n\n• *Patient:* ${e.patient_name}\n• *Blood Group:* ${e.blood_group}\n• *Hemoglobin:* ${e.hemoglobin} g/dL\n• *Confidence:* ${(ocr.confidence_score*100).toFixed(0)}%`, [{label:'🏠 Main Menu',value:'hi'}]);
            }
        } else {
            const rag = await api.get(`/api/analytics/rag/query?q=${encodeURIComponent(text)}`);
            if (rag && rag.answer) addBotMessage(`${rag.answer}\n\n_Sources: ${rag.sources.map(s=>s.title).join(', ')}_`, [{label:'🏠 Menu',value:'hi'}]);
            else addBotMessage("I didn't understand that. Type *hi* to see options.");
        }
    } else if (waState.step === 'wait_blood_type') {
        const bt = c.toUpperCase().replace(/\s/g,'');
        if (!["A+","A-","B+","B-","AB+","AB-","O+","O-"].includes(bt)) { addBotMessage("⚠️ Invalid type. Try: O+, B-, A+"); return; }
        const res = await api.post('/api/matching/find', {blood_type:bt,urgency:'critical',max_distance_km:40,units_needed:1,latitude:12.9716,longitude:77.5946});
        if (res && res.matches && res.matches.length > 0) {
            let s = `🔍 *Donors for ${bt}*\n\n`;
            res.matches.slice(0,3).forEach((m,i) => { s += `${i+1}. *${m.donor_name}* (${(m.match_score*100).toFixed(0)}%)\n📍 ${m.distance_km} km · 📞 ${m.phone}\n\n`; });
            const banks = await api.get(`/api/blood-banks?blood_type=${bt}`);
            if (banks && banks.length) { const b = banks[0]; s += `🏥 *${b.name}*\n📞 ${b.contact_phone} · Stock: ${b.inventory[bt]} units`; }
            addBotMessage(s, [{label:'🏠 Menu',value:'hi'}]);
        } else addBotMessage(`⚠️ No donors found for *${bt}*.`);
        waState.step = 'menu';
    } else if (waState.step === 'wait_rag') {
        const res = await api.get(`/api/analytics/rag/query?q=${encodeURIComponent(text)}`);
        if (res && res.answer) addBotMessage(`📚 *Safety Response*\n\n${res.answer}\n\n_Sources: ${res.sources.map(s=>s.title).join(', ')}_`, [{label:'🏠 Menu',value:'hi'}]);
        else addBotMessage("⚠️ Could not find an answer. Try rephrasing.");
        waState.step = 'menu';
    }
}
