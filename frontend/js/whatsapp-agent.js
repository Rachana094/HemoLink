/**
 * HemoLink WhatsApp Agent Simulator
 * Simulates a high-fidelity WhatsApp-style chatbot interface with tap actions and interactive replies.
 */

let waState = {
    step: 'menu', // menu, wait_blood_type, wait_routing, wait_rag
    history: []
};

// Global helper to trigger buttons from within chat bubbles
window.triggerWaButton = function(val) {
    const input = document.getElementById('wa-input');
    if (input) {
        input.value = val;
        // Trigger send
        const sendBtn = document.getElementById('wa-send');
        if (sendBtn) sendBtn.click();
    }
};

function renderWhatsAppAgent(container) {
    destroyCharts();
    container.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">💬 WhatsApp Continuity & Engagement Simulator</div>
                <div class="section-subtitle">Simulate HemoLink's WhatsApp chatbot (inspired by Namma Metro WhatsApp bot) for automated coordination</div>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 380px;gap:24px;max-width:1100px;margin:0 auto;">
            <!-- Instructions and Live API Logger -->
            <div style="display:flex;flex-direction:column;gap:20px;">
                <div class="glass-card card-section">
                    <div class="card-section-title">💡 Interactive Chatbot Simulation</div>
                    <p style="color:var(--text-secondary);font-size:14px;margin-bottom:12px;">
                        The <strong>Continuity & Engagement Agent (CEA)</strong> deploys conversational digital twins on channels like WhatsApp to keep donors engaged and handle emergency requests.
                    </p>
                    <p style="color:var(--text-secondary);font-size:14px;margin-bottom:12px;">
                        This module simulates the WhatsApp bot. Type <strong>"hi"</strong> or <strong>tap the interactive buttons</strong> in the chat to test it.
                    </p>
                    <div style="margin-top:16px;">
                        <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:8px;">SIMULATION STAGE</div>
                        <span id="wa-stage-pill" class="tag tag-accent">Active Stage: MENU</span>
                    </div>
                </div>

                <div class="glass-card card-section" style="flex:1;">
                    <div class="card-section-title">📊 Agent Reasoning Log</div>
                    <div id="wa-logger" class="reasoning-log" style="height:250px;max-height:none;">
                        <div class="log-line">[System] Simulator initialized. Ready for user input.</div>
                    </div>
                </div>
            </div>

            <!-- WhatsApp Phone Wrapper -->
            <div class="phone-wrapper glass-card">
                <div class="phone-screen">
                    <!-- Top Bar -->
                    <div class="wa-header">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <span style="font-size:20px;">🩸</span>
                            <div>
                                <div style="font-weight:700;font-size:14px;">HemoLink AI Agent</div>
                                <div style="font-size:10px;color:rgba(255,255,255,0.7);display:flex;align-items:center;gap:4px;">
                                    <span style="display:inline-block;width:6px;height:6px;background:#22c55e;border-radius:50%;"></span> online
                                </div>
                            </div>
                        </div>
                        <div style="font-size:16px;color:rgba(255,255,255,0.8);cursor:pointer;" onclick="triggerWaButton('hi')">🔄 Reset</div>
                    </div>

                    <!-- Chat Body -->
                    <div class="wa-chat-body" id="wa-chat-body">
                        <!-- Message templates dynamically loaded -->
                    </div>

                    <!-- Input Area -->
                    <div class="wa-input-area">
                        <input type="text" id="wa-input" placeholder="Type a message or tap above..." class="wa-input-field">
                        <button id="wa-send" class="wa-send-btn">➔</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Load initial messages if history is empty
    if (waState.history.length === 0) {
        sendMenuMessage();
    } else {
        renderHistory();
    }

    // Event listener
    const input = document.getElementById('wa-input');
    const sendBtn = document.getElementById('wa-send');

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    sendBtn.addEventListener('click', handleSend);
}

function logSystem(msg) {
    const logger = document.getElementById('wa-logger');
    if (logger) {
        logger.innerHTML += `<div class="log-line">[System] ${msg}</div>`;
        logger.scrollTop = logger.scrollHeight;
    }
}

function updateStagePill(stage) {
    const pill = document.getElementById('wa-stage-pill');
    if (pill) {
        pill.textContent = `Active Stage: ${stage.toUpperCase()}`;
    }
}

function sendMenuMessage() {
    const text = `Hi! I am the HemoLink AI Assistant. 🩸\n\nI can help you coordinate donor matches, look up blood inventory, query safety guidelines, or locate hospitals.\n\nPlease choose one of the options below:`;
    const buttons = [
        { label: '🩸 Find compatible donors', value: '1' },
        { label: '🏥 Hospital route map', value: '2' },
        { label: '📊 Check blood stock levels', value: '3' },
        { label: '📚 Safety guidelines (RAG)', value: '4' },
        { label: '📄 Scan blood report (OCR)', value: '5' }
    ];
    addBotMessage(text, buttons);
}

function addBotMessage(text, buttons = []) {
    const msg = { sender: 'bot', text, buttons, time: getFormattedTime() };
    waState.history.push(msg);
    appendMessageHTML(msg);
}

function addUserMessage(text) {
    const msg = { sender: 'user', text, time: getFormattedTime() };
    waState.history.push(msg);
    appendMessageHTML(msg);
}

function getFormattedTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function appendMessageHTML(msg) {
    const body = document.getElementById('wa-chat-body');
    if (!body) return;

    const div = document.createElement('div');
    div.className = `wa-msg ${msg.sender === 'user' ? 'wa-msg-user' : 'wa-msg-bot'}`;
    
    // Convert newlines to breaks and markdown bold text
    let formattedText = msg.text
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    let btnHTML = '';
    if (msg.buttons && msg.buttons.length > 0) {
        btnHTML = `
            <div style="display:flex; flex-direction:column; gap:6px; margin-top:10px; border-top:1px solid rgba(255,255,255,0.06); padding-top:8px;">
                ${msg.buttons.map(b => `
                    <button class="wa-chat-btn" onclick="triggerWaButton('${b.value}')" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:6px 12px; color:var(--accent-400); font-size:12px; text-align:left; cursor:pointer; font-weight:600; display:flex; align-items:center; justify-content:space-between; transition:background 0.2s;">
                        <span>${b.label}</span>
                        <span>➔</span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    div.innerHTML = `
        <div class="wa-msg-bubble" style="width:100%;">
            <div class="wa-msg-text">${formattedText}</div>
            ${btnHTML}
            <div class="wa-msg-time">${msg.time}</div>
        </div>
    `;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
}

function renderHistory() {
    const body = document.getElementById('wa-chat-body');
    if (!body) return;
    body.innerHTML = '';
    waState.history.forEach(appendMessageHTML);
}

async function handleSend() {
    const input = document.getElementById('wa-input');
    const text = input.value.trim();
    if (!text) return;

    addUserMessage(text);
    input.value = '';

    // Simulate typing delay
    setTimeout(async () => {
        await processInput(text);
    }, 600);
}

async function processInput(text) {
    const cleaned = text.toLowerCase().trim();

    // Reset command
    if (cleaned === 'hi' || cleaned === 'hello' || cleaned === 'menu' || cleaned === 'reset') {
        waState.step = 'menu';
        updateStagePill(waState.step);
        logSystem("Reset conversation to Main Menu.");
        sendMenuMessage();
        return;
    }

    if (waState.step === 'menu') {
        if (cleaned === '1' || cleaned.includes('donor')) {
            waState.step = 'wait_blood_type';
            updateStagePill(waState.step);
            logSystem("Transitioned to blood type search flow.");
            
            const bloodTypeButtons = [
                { label: '🩸 O+', value: 'O+' },
                { label: '🩸 O-', value: 'O-' },
                { label: '🩸 B+', value: 'B+' },
                { label: '🩸 A+', value: 'A+' },
                { label: '🩸 AB+', value: 'AB+' }
            ];
            addBotMessage("Please select the blood type needed or type it manually (e.g., O+, B-, A-):", bloodTypeButtons);
        } else if (cleaned === '2' || cleaned.includes('route') || cleaned.includes('hospital')) {
            waState.step = 'wait_routing';
            updateStagePill(waState.step);
            logSystem("Transitioned to routing search flow.");
            
            const routeButtons = [
                { label: '🚇 Indiranagar to Hebbal', value: 'indiranagar to hebbal' },
                { label: '🚇 Koramangala to Central', value: 'koramangala to central' },
                { label: '🚇 MG Road to Whitefield', value: 'mg_road to whitefield' }
            ];
            addBotMessage("Please enter the route in format: **Origin to Destination** (e.g. *indiranagar to hebbal*) or choose one below:", routeButtons);
        } else if (cleaned === '3' || cleaned.includes('stock') || cleaned.includes('inventory')) {
            logSystem("Fetching real-time stock levels...");
            const data = await api.get('/api/predictions/shortages');
            if (data && data.alerts) {
                let stockStr = "📊 **Current Blood Stock Levels**\n\n";
                Object.entries(data.inventory).forEach(([bt, count]) => {
                    const status = count < 10 ? '🚨 LOW' : count < 30 ? '⚠️ MODERATE' : '✅ ADEQUATE';
                    stockStr += `• **${bt}**: ${count} units (${status})\n`;
                });
                const critical = data.alerts.filter(a => a.risk_level === 'critical');
                if (critical.length) {
                    stockStr += `\n⚠️ *Shortage warning:* ${critical.map(a => a.blood_type).join(', ')} stocks are critically low!`;
                }
                
                const menuButtons = [{ label: '🏠 Go to Main Menu', value: 'hi' }];
                addBotMessage(stockStr, menuButtons);
            } else {
                addBotMessage("⚠️ Failed to fetch inventory metrics. Try again or type **'hi'**.");
            }
        } else if (cleaned === '4' || cleaned.includes('rag') || cleaned.includes('rules') || cleaned.includes('guidelines')) {
            waState.step = 'wait_rag';
            updateStagePill(waState.step);
            logSystem("Transitioned to RAG compliance querying flow.");
            
            const ragButtons = [
                { label: '📚 Who is the universal donor?', value: 'Who is the universal donor?' },
                { label: '📚 What is the age limit for donation?', value: 'What is the age limit for donation?' },
                { label: '📚 How long can blood be stored?', value: 'How long can blood be stored?' }
            ];
            addBotMessage("Ask me any question about blood donation safety rules, compliance guidelines, or medical deferral criteria:", ragButtons);
        } else if (cleaned === '5' || cleaned.includes('ocr') || cleaned.includes('scan') || cleaned.includes('report')) {
            logSystem("Processing simulated OCR extraction from a lab report...");
            const ocr = await api.get('/api/analytics/ocr/process?doc_type=blood_report');
            if (ocr) {
                const text = `📄 **Lab Report Digitization Complete**\n\n• **Patient:** ${ocr.extracted_entities.patient_name || 'N/A'}\n• **Age/Gender:** ${ocr.extracted_entities.age || 'N/A'} / ${ocr.extracted_entities.gender || 'N/A'}\n• **Blood Group:** ${ocr.extracted_entities.blood_group || 'N/A'}\n• **Hemoglobin:** ${ocr.extracted_entities.hemoglobin || 'N/A'} g/dL\n\n✅ *Status:* Verified and digitised with ${(ocr.confidence_score * 100).toFixed(0)}% confidence.`;
                const menuButtons = [{ label: '🏠 Go to Main Menu', value: 'hi' }];
                addBotMessage(text, menuButtons);
            } else {
                addBotMessage("⚠️ OCR parser failed. Please type **'hi'** to return.");
            }
        } else {
            // General query fallback (RAG query)
            logSystem(`Routing raw input query to RAG: "${text}"`);
            const rag = await api.get(`/api/analytics/rag/query?q=${encodeURIComponent(text)}`);
            if (rag && rag.answer) {
                addBotMessage(`${rag.answer}\n\n📚 *Sources:* ${rag.sources.map(s => s.title).join(', ')}`, [{ label: '🏠 Main Menu', value: 'hi' }]);
            } else {
                addBotMessage("I didn't quite get that. Type **'hi'** to go back to the menu.");
            }
        }
    } else if (waState.step === 'wait_blood_type') {
        const bt = cleaned.toUpperCase().replace(/\s/g, '');
        const validTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
        
        if (!validTypes.includes(bt)) {
            addBotMessage("⚠️ Invalid blood type. Please enter a valid group (e.g. O+, B-, A+):");
            return;
        }

        logSystem(`Executing semantic search for blood group: ${bt}`);
        const result = await api.post('/api/matching/find', {
            blood_type: bt,
            urgency: 'critical',
            max_distance_km: 40,
            units_needed: 1,
            latitude: 12.9716, longitude: 77.5946
        });

        if (result && result.matches && result.matches.length > 0) {
            let matchesStr = `🔍 **Matched Donors for ${bt} (Critical)**\n\n`;
            
            result.matches.slice(0, 3).forEach((m, idx) => {
                const cleanPhone = m.phone.replace(/[^0-9]/g, '');
                const waLink = `https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(m.donor_name)}%2C%20this%20is%20HemoLink.%20We%20have%20an%20urgent%20need%20for%20${bt}%20blood.`;
                matchesStr += `${idx+1}️⃣ **${m.donor_name}** (${(m.match_score * 100).toFixed(0)}% match)\n📍 Dist: ${m.distance_km} km\n📞 Phone: ${m.phone}\n💬 **[Direct WhatsApp Link](${waLink})**\n\n`;
            });
            
            // Also append nearest blood bank info
            const banks = await api.get(`/api/blood-banks?blood_type=${bt}`);
            if (banks && banks.length > 0) {
                const b = banks[0];
                matchesStr += `🏥 **Nearest Blood Bank:**\n**${b.name}**\n📞 ${b.contact_phone} (Stock: ${b.inventory[bt]} units)\n\n`;
            }

            addBotMessage(matchesStr, [{ label: '🏠 Main Menu', value: 'hi' }]);
        } else {
            addBotMessage(`⚠️ No compatible donors found for **${bt}** in the 40km search radius. Try again or type **'hi'**.`);
        }
        waState.step = 'menu';
        updateStagePill(waState.step);
    } else if (waState.step === 'wait_routing') {
        const parts = cleaned.split(' to ');
        if (parts.length !== 2) {
            addBotMessage("⚠️ Invalid format. Please enter as *Origin to Destination*:\nExample: *indiranagar to hebbal*");
            return;
        }

        const origin = parts[0].trim().replace(/\s/g, '_');
        const dest = parts[1].trim().replace(/\s/g, '_');

        logSystem(`Fetching coordinate nodes for zone: ${origin} and ${dest}`);
        const network = await api.get('/api/analytics/routing/network');
        if (!network) {
            addBotMessage("⚠️ Failed to load city network data.");
            waState.step = 'menu';
            updateStagePill(waState.step);
            return;
        }

        const oNode = network.nodes.find(n => n.name.toLowerCase() === origin);
        const dNode = network.nodes.find(n => n.name.toLowerCase() === dest);

        if (!oNode || !dNode) {
            addBotMessage(`⚠️ Could not find one of the zones. Make sure they are in the list.\nExample: *mg_road to whitefield*`);
            return;
        }

        logSystem(`Executing pathfinding routing algorithm from ${oNode.name} to ${dNode.name}`);
        const route = await api.get(`/api/analytics/routing/find?olat=${oNode.lat}&olng=${oNode.lng}&dlat=${dNode.lat}&dlng=${dNode.lng}`);
        if (route) {
            addBotMessage(`🧭 **Optimal Route Found (${route.algorithm_used})**\n\n• **Distance:** ${route.distance_km} km\n• **Travel Time:** ${route.estimated_time_minutes} mins\n• **Stops:** ${route.path.map(p => p.name.replace(/_/g, ' ')).join(' ➔ ')}`, [{ label: '🏠 Main Menu', value: 'hi' }]);
        } else {
            addBotMessage("⚠️ Pathfinding error. Please try again.");
        }
        waState.step = 'menu';
        updateStagePill(waState.step);
    } else if (waState.step === 'wait_rag') {
        logSystem(`Sending compliance query: "${text}"`);
        const res = await api.get(`/api/analytics/rag/query?q=${encodeURIComponent(text)}`);
        if (res && res.answer) {
            addBotMessage(`📚 **Safety & Compliance RAG Response**\n\n${res.answer}\n\n• *Sources:* ${res.sources.map(s => s.title).join(', ')}`, [{ label: '🏠 Main Menu', value: 'hi' }]);
        } else {
            addBotMessage("⚠️ RAG Agent timeout. Try again.");
        }
        waState.step = 'menu';
        updateStagePill(waState.step);
    }
}
