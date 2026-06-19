/**
 * HemoLink Blood Bank & Hospital Registry View
 */

async function renderBloodBank(container) {
    destroyCharts();
    
    container.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">🏥 Blood Bank & Hospital Registry</div>
                <div class="section-subtitle">Track real-time inventory, operating hours, and request blood components from nearest facilities</div>
            </div>
        </div>

        <div class="content-grid" style="grid-template-columns: 1fr 350px; gap: 24px;">
            <!-- Blood Bank List -->
            <div class="card-section glass-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <div class="card-section-title">Registered Facilities</div>
                    <select id="filter-blood-type" class="form-select" style="width:140px; padding:6px 12px; font-size:12px;">
                        <option value="">All Stock</option>
                        <option value="O-">O- Stock</option>
                        <option value="O+">O+ Stock</option>
                        <option value="A+">A+ Stock</option>
                        <option value="A-">A- Stock</option>
                        <option value="B+">B+ Stock</option>
                        <option value="B-">B- Stock</option>
                        <option value="AB+">AB+ Stock</option>
                        <option value="AB-">AB- Stock</option>
                    </select>
                </div>
                <div id="bb-list" class="match-list" style="display:flex; flex-direction:column; gap:16px;">
                    <!-- Dynamically populated -->
                </div>
            </div>

            <!-- Request / Requisition Sidepanel -->
            <div class="card-section glass-card" style="align-self: flex-start;">
                <div class="card-section-title">📦 Fast Requisition</div>
                <div id="req-form">
                    <div class="form-group" style="margin-bottom:12px;">
                        <label for="req-facility">Select Facility</label>
                        <select id="req-facility" class="form-select">
                            <!-- Populated dynamically -->
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom:12px;">
                        <label for="req-type">Blood Component</label>
                        <select id="req-type" class="form-select">
                            <option value="O-">O- (Universal)</option>
                            <option value="O+">O+</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+" selected>B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom:16px;">
                        <label for="req-units">Units Requested</label>
                        <input type="number" id="req-units" class="form-input" value="2" min="1" max="10">
                    </div>
                    <button id="submit-req" class="btn btn-primary btn-full">⚡ Send Request Requisition</button>
                </div>
                <div id="req-status" style="margin-top:16px; display:none;"></div>
            </div>
        </div>
    `;

    const filterSelect = document.getElementById('filter-blood-type');
    
    // Load banks
    async function loadBanks() {
        const bloodType = filterSelect.value;
        const url = bloodType ? `/api/blood-banks?blood_type=${bloodType}` : '/api/blood-banks';
        const banks = await api.get(url);
        
        if (!banks || banks.length === 0) {
            document.getElementById('bb-list').innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:30px;">No blood banks found with inventory.</div>`;
            return;
        }

        // Populate Form Select
        const reqFacilitySelect = document.getElementById('req-facility');
        reqFacilitySelect.innerHTML = banks.map(b => `<option value="${b.id}">${b.name}</option>`).join('');

        // Populate List
        document.getElementById('bb-list').innerHTML = banks.map((b, i) => {
            const typeTag = b.type === 'hospital' ? '<span class="tag tag-accent">🏥 Hospital Bank</span>' : '<span class="tag tag-primary">🩸 Standalone</span>';
            const cleanPhone = b.contact_phone ? b.contact_phone.replace(/[^0-9]/g, '') : '';
            const waMsg = `Hi ${b.name}, we need to requisition blood from your inventory.`;
            const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}`;
            
            // Format inventory keys
            let invHTML = '<div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:6px; margin-top:8px;">';
            Object.entries(b.inventory).forEach(([bt, count]) => {
                const isLow = count < 10;
                const badgeColor = isLow ? 'var(--danger)' : 'var(--text-secondary)';
                invHTML += `
                    <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:4px; padding:4px; text-align:center;">
                        <span style="font-size:10px; color:var(--text-muted);">${bt}</span>
                        <div style="font-weight:700; font-size:12px; color:${badgeColor};">${count} u</div>
                    </div>
                `;
            });
            invHTML += '</div>';

            return `
                <div class="match-card" style="animation:slideInUp 0.3s ease ${i * 0.08}s both; display:flex; flex-direction:column; align-items:stretch; gap:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <div style="font-weight:700; font-size:15px; color:var(--text-primary);">${b.name}</div>
                            <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">📍 ${b.address}</div>
                        </div>
                        <div>
                            ${typeTag}
                        </div>
                    </div>

                    <div>
                        <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Current Inventory</div>
                        ${invHTML}
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.04); padding-top:10px; font-size:12px;">
                        <div style="color:var(--text-muted); display:flex; gap:12px;">
                            <span>📞 <strong>${b.contact_phone}</strong></span>
                            <span>⏱️ <strong>${b.operating_hours}</strong></span>
                        </div>
                        <div style="display:flex; gap:6px;">
                            <a href="tel:${b.contact_phone}" class="tag tag-accent" style="text-decoration:none;">📞 Call</a>
                            <a href="${waLink}" target="_blank" class="tag tag-primary" style="background:rgba(34,197,94,0.1); color:#22c55e; border-color:rgba(34,197,94,0.2); text-decoration:none;">💬 WhatsApp</a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Filter Change
    filterSelect.addEventListener('change', loadBanks);
    
    // Initial Load
    await loadBanks();

    // Requisition Submit Handler
    document.getElementById('submit-req').addEventListener('click', async () => {
        const btn = document.getElementById('submit-req');
        btn.innerHTML = '⏳ Processing Requisition...';
        btn.disabled = true;

        const data = {
            bank_id: document.getElementById('req-facility').value,
            blood_type: document.getElementById('req-type').value,
            units_requested: parseInt(document.getElementById('req-units').value)
        };

        const res = await api.post('/api/blood-banks/request', data);
        const statusDiv = document.getElementById('req-status');
        statusDiv.style.display = 'block';

        if (res && res.status === 'success') {
            statusDiv.innerHTML = `
                <div style="padding:12px; background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.3); border-radius:8px; font-size:13px;">
                    <div style="font-weight:700; color:var(--success); margin-bottom:4px;">✅ Requisition Approved</div>
                    <p style="color:var(--text-secondary); margin-bottom:8px;">${res.message}</p>
                    <div style="font-size:11px; color:var(--text-muted); display:flex; flex-direction:column; gap:2px;">
                        <span>📞 Phone: ${res.contact_phone}</span>
                        <span>✉️ Email: ${res.contact_email}</span>
                        <span>📦 Remaining Stock: ${res.remaining_stock} units</span>
                    </div>
                </div>
            `;
            // Reload lists to show updated stocks
            await loadBanks();
        } else {
            statusDiv.innerHTML = `
                <div style="padding:12px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:8px; font-size:13px; color:var(--danger);">
                    ⚠️ Requisition Rejected. Insufficient inventory at target facility.
                </div>
            `;
        }

        btn.innerHTML = '⚡ Send Request Requisition';
        btn.disabled = false;
    });
}
