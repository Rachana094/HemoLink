/**
 * HemoLink — Blood Warrior Dispatch Control Center
 */

let riders = [
    { name: "Rohan K.", vehicle: "KTM Duke 200", phone: "+919845012345", blood_group: "O+", lat: 13.0358, lng: 77.5970, zone: "hebbal", status: "Idle", color: "#60a5fa", deliveries: 48, rating: 4.9 },
    { name: "Vikram S.", vehicle: "Ather 450X (EV)", phone: "+919632178456", blood_group: "B+", lat: 12.9698, lng: 77.7500, zone: "whitefield", status: "Idle", color: "#34d399", deliveries: 35, rating: 4.8 },
    { name: "Sneha R.", vehicle: "Honda Activa 6G", phone: "+919741256890", blood_group: "A+", lat: 12.8399, lng: 77.6770, zone: "electronic_city", status: "Idle", color: "#fb7185", deliveries: 62, rating: 5.0 },
    { name: "Priya M.", vehicle: "Bajaj Pulsar 150", phone: "+919900234567", blood_group: "AB+", lat: 12.9969, lng: 77.5700, zone: "malleshwaram", status: "Idle", color: "#a78bfa", deliveries: 41, rating: 4.7 }
];

let activeDispatch = null;
let mapAnimationId = null;

async function renderMap(container) {
    if (mapAnimationId) { cancelAnimationFrame(mapAnimationId); mapAnimationId = null; }
    destroyCharts();

    const network = await api.get('/api/analytics/routing/network');
    if (!network) return;

    const facilities = [
        { id: "victoria", name: "Victoria Hospital", lat: 12.9645, lng: 77.5760, zone: "central", phone: "+918026701111" },
        { id: "st_johns", name: "St. John's Medical College", lat: 12.9322, lng: 77.6244, zone: "koramangala", phone: "+918022065000" },
        { id: "rotary", name: "Rotary TTK Blood Bank", lat: 12.9784, lng: 77.6408, zone: "indiranagar", phone: "+918025287903" },
        { id: "red_cross", name: "Red Cross Blood Bank", lat: 12.9757, lng: 77.6063, zone: "mg_road", phone: "+918022268435" },
        { id: "rashtrotthana", name: "Rashtrotthana Blood Bank", lat: 12.9300, lng: 77.5838, zone: "jayanagar", phone: "+918026612730" }
    ];

    const hospitalOpts = facilities.map(f => `<option value="${f.id}">${f.name} (${f.zone.replace(/_/g,' ').toUpperCase()})</option>`).join('');

    // Rider profile cards HTML
    const riderCardsHTML = riders.map(r => {
        const waLink = `https://wa.me/${r.phone.replace(/[^0-9]/g,'')}?text=${encodeURIComponent('HemoLink Dispatch: You have a new blood delivery assignment. Please check the app.')}`;
        return `
        <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:12px; display:flex; gap:12px; align-items:center;">
            <div style="width:42px;height:42px;border-radius:50%;background:${r.color}22;border:2px solid ${r.color};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">🏍️</div>
            <div style="flex:1;min-width:0;">
                <div style="font-weight:700;font-size:13px;color:${r.color};">${r.name}</div>
                <div style="font-size:10px;color:var(--text-muted);margin-top:1px;">${r.vehicle} · 🩸 ${r.blood_group}</div>
                <div style="font-size:10px;color:var(--text-muted);">📍 ${r.zone.replace(/_/g,' ').toUpperCase()} · ⭐ ${r.rating} · ${r.deliveries} deliveries</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0;">
                <a href="tel:${r.phone}" class="tag tag-accent" style="text-decoration:none;font-size:9px;padding:2px 6px;">📞 ${r.phone.slice(-5)}</a>
                <a href="${waLink}" target="_blank" class="tag" style="text-decoration:none;font-size:9px;padding:2px 6px;background:rgba(34,197,94,0.1);color:#22c55e;border-color:rgba(34,197,94,0.2);">💬 WhatsApp</a>
            </div>
        </div>`;
    }).join('');

    container.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">🏍️ Blood Warrior Dispatch Center</div>
                <div class="section-subtitle">Emergency blood courier network — assign riders, track pickups & deliveries across Bangalore</div>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 400px; gap: 20px;">
            <!-- Left: Map + Mission Briefing -->
            <div style="display:flex;flex-direction:column;gap:20px;">
                <div class="glass-card card-section" style="display:flex;flex-direction:column;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <div class="card-section-title">🗺️ Live Dispatch Tracker — Bangalore</div>
                        <span id="dispatch-indicator" class="tag tag-primary">All Riders Idle</span>
                    </div>
                    <div class="map-canvas-container" style="flex:1;min-height:420px;background:rgba(0,0,0,0.15);border-radius:8px;border:1px solid rgba(255,255,255,0.05);position:relative;">
                        <canvas id="map-canvas" style="display:block;width:100%;height:100%;"></canvas>
                    </div>
                </div>

                <!-- Mission Briefing Card (appears after dispatch) -->
                <div id="mission-briefing" style="display:none;"></div>

                <!-- Dispatch Logs -->
                <div class="glass-card card-section">
                    <div class="card-section-title">📋 Dispatch Event Log</div>
                    <div id="dispatch-logs" class="reasoning-log" style="height:140px;max-height:none;font-size:11px;">
                        <div class="log-line">[System] Fleet online. 4 Blood Warriors standing by...</div>
                    </div>
                </div>
            </div>

            <!-- Right: Dispatch Form + Warrior Profiles -->
            <div style="display:flex;flex-direction:column;gap:20px;">
                <!-- Emergency Dispatch Form -->
                <div class="glass-card card-section">
                    <div class="card-section-title">🚨 Emergency Blood Request</div>
                    <div class="form-group" style="margin-bottom:10px;">
                        <label for="dispatch-dest">Deliver To (Hospital)</label>
                        <select id="dispatch-dest" class="form-select">${hospitalOpts}</select>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
                        <div class="form-group">
                            <label for="dispatch-blood-type">Blood Type</label>
                            <select id="dispatch-blood-type" class="form-select">
                                <option value="O-">O- (Universal)</option><option value="O+">O+</option>
                                <option value="A+">A+</option><option value="A-">A-</option>
                                <option value="B+" selected>B+</option><option value="B-">B-</option>
                                <option value="AB+">AB+</option><option value="AB-">AB-</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="dispatch-units">Units</label>
                            <input type="number" id="dispatch-units" class="form-input" value="2" min="1" max="10">
                        </div>
                    </div>
                    <button id="btn-dispatch-rider" class="btn btn-primary btn-full">⚡ Dispatch Blood Warrior</button>
                </div>

                <!-- Warrior Profiles -->
                <div class="glass-card card-section">
                    <div class="card-section-title">👥 Blood Warrior Fleet</div>
                    <div id="warrior-profiles" style="display:flex;flex-direction:column;gap:10px;">
                        ${riderCardsHTML}
                    </div>
                </div>
            </div>
        </div>
    `;

    const canvas = document.getElementById('map-canvas');
    const ctx = canvas.getContext('2d');
    function resizeCanvas() { const r = canvas.parentElement.getBoundingClientRect(); canvas.width = r.width; canvas.height = r.height; }
    resizeCanvas();

    function logDispatch(msg) {
        const logger = document.getElementById('dispatch-logs');
        if (logger) {
            const t = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});
            logger.innerHTML += `<div class="log-line">[${t}] ${msg}</div>`;
            logger.scrollTop = logger.scrollHeight;
        }
    }

    function showMissionBriefing(rider, bankName, bankPhone, hospital, bloodType, units, totalDist, totalEta) {
        const waMsg = `URGENT DISPATCH: Hi ${rider.name}, pick up ${units} units of ${bloodType} from ${bankName} and deliver to ${hospital.name}. Contact bank: ${bankPhone}`;
        const waLink = `https://wa.me/${rider.phone.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(waMsg)}`;
        document.getElementById('mission-briefing').style.display = 'block';
        document.getElementById('mission-briefing').innerHTML = `
            <div class="glass-card card-section" style="border:1px solid rgba(245,158,11,0.3);background:rgba(245,158,11,0.03);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                    <div class="card-section-title" style="margin-bottom:0;color:#f59e0b;">📋 Active Mission Briefing</div>
                    <span class="tag tag-accent" style="animation:pulse 1.5s infinite;">LIVE</span>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
                    <!-- Warrior Info -->
                    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:8px;padding:12px;">
                        <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Assigned Warrior</div>
                        <div style="font-weight:800;font-size:15px;color:${rider.color};">🏍️ ${rider.name}</div>
                        <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">${rider.vehicle}</div>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">📞 <strong>${rider.phone}</strong></div>
                        <div style="display:flex;gap:6px;margin-top:8px;">
                            <a href="tel:${rider.phone}" class="tag tag-accent" style="text-decoration:none;font-size:10px;">📞 Call Rider</a>
                            <a href="${waLink}" target="_blank" class="tag" style="text-decoration:none;font-size:10px;background:rgba(34,197,94,0.1);color:#22c55e;border-color:rgba(34,197,94,0.2);">💬 WhatsApp</a>
                        </div>
                    </div>
                    <!-- Cargo Info -->
                    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:8px;padding:12px;">
                        <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Blood Cargo</div>
                        <div style="font-weight:800;font-size:28px;color:var(--primary-400);line-height:1;">${bloodType}</div>
                        <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;"><strong>${units} units</strong> · Cold Chain Box</div>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">🕐 ETA: <strong>${totalEta} min</strong> · 📏 ${totalDist} km</div>
                    </div>
                </div>
                <!-- Route Steps -->
                <div style="display:flex;align-items:stretch;gap:0;margin-bottom:8px;">
                    <div style="flex:1;background:rgba(96,165,250,0.08);border:1px solid rgba(96,165,250,0.15);border-radius:8px 0 0 8px;padding:10px;text-align:center;">
                        <div style="font-size:16px;">🏍️</div>
                        <div style="font-size:10px;font-weight:700;color:var(--text-primary);margin-top:4px;">RIDER</div>
                        <div style="font-size:9px;color:var(--text-muted);">${rider.zone.replace(/_/g,' ').toUpperCase()}</div>
                    </div>
                    <div style="display:flex;align-items:center;color:#f59e0b;font-size:16px;padding:0 4px;">➤</div>
                    <div style="flex:1;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.15);padding:10px;text-align:center;">
                        <div style="font-size:16px;">🩸</div>
                        <div style="font-size:10px;font-weight:700;color:var(--text-primary);margin-top:4px;">PICKUP</div>
                        <div style="font-size:9px;color:var(--text-muted);">${bankName}</div>
                        <div style="font-size:9px;color:var(--text-muted);">📞 ${bankPhone}</div>
                    </div>
                    <div style="display:flex;align-items:center;color:#14b8a6;font-size:16px;padding:0 4px;">➤</div>
                    <div style="flex:1;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.15);border-radius:0 8px 8px 0;padding:10px;text-align:center;">
                        <div style="font-size:16px;">🏥</div>
                        <div style="font-size:10px;font-weight:700;color:var(--text-primary);margin-top:4px;">DELIVER</div>
                        <div style="font-size:9px;color:var(--text-muted);">${hospital.name}</div>
                        <div style="font-size:9px;color:var(--text-muted);">📞 ${hospital.phone}</div>
                    </div>
                </div>
                <div id="mission-status" style="text-align:center;font-size:11px;color:#f59e0b;font-weight:600;padding-top:4px;">🏍️ Rider en route to Blood Bank for pickup...</div>
            </div>
        `;
    }

    function latLngToXY(lat, lng) {
        const minLat=12.80,maxLat=13.13,minLng=77.47,maxLng=77.79,pad=50;
        return [pad+((lng-minLng)/(maxLng-minLng))*(canvas.width-2*pad), pad+((maxLat-lat)/(maxLat-minLat))*(canvas.height-2*pad)];
    }

    function drawMap() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.strokeStyle='rgba(255,255,255,0.02)'; ctx.lineWidth=1;
        for(let i=0;i<canvas.width;i+=40){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,canvas.height);ctx.stroke();}
        for(let i=0;i<canvas.height;i+=40){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(canvas.width,i);ctx.stroke();}

        const nodes=network.nodes;
        ctx.strokeStyle='rgba(255,255,255,0.05)';ctx.lineWidth=1;
        for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
            const[x1,y1]=latLngToXY(nodes[i].lat,nodes[i].lng),[x2,y2]=latLngToXY(nodes[j].lat,nodes[j].lng);
            if(Math.sqrt((x2-x1)**2+(y2-y1)**2)<180){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
        }

        if(activeDispatch&&activeDispatch.currentPath&&activeDispatch.currentPath.length>0){
            ctx.beginPath();const s=activeDispatch.currentPath[0];const[sx,sy]=latLngToXY(s.lat,s.lng);ctx.moveTo(sx,sy);
            for(let i=1;i<activeDispatch.currentPath.length;i++){const p=activeDispatch.currentPath[i];const[px,py]=latLngToXY(p.lat,p.lng);ctx.lineTo(px,py);}
            ctx.lineWidth=4;ctx.strokeStyle=activeDispatch.phase==='pickup'?'rgba(245,158,11,0.6)':'rgba(20,184,166,0.6)';
            ctx.shadowColor=activeDispatch.phase==='pickup'?'#f59e0b':'#14b8a6';ctx.shadowBlur=8;ctx.stroke();ctx.shadowBlur=0;
        }

        nodes.forEach(n=>{const[x,y]=latLngToXY(n.lat,n.lng);ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.2)';ctx.fill();
            ctx.fillStyle='rgba(255,255,255,0.4)';ctx.font='8px JetBrains Mono';ctx.textAlign='center';ctx.fillText(n.name.replace(/_/g,' ').toUpperCase(),x,y-10);});

        facilities.forEach(f=>{const[x,y]=latLngToXY(f.lat,f.lng);const isHosp=f.id==='victoria'||f.id==='st_johns';
            ctx.beginPath();ctx.arc(x,y,16,0,Math.PI*2);ctx.fillStyle=isHosp?'rgba(239,68,68,0.15)':'rgba(59,130,246,0.15)';ctx.fill();
            ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.fillStyle=isHosp?'#ef4444':'#3b82f6';ctx.fill();
            ctx.fillStyle='#fff';ctx.font='bold 9px Inter';ctx.textAlign='center';ctx.fillText(isHosp?'🏥':'🩸',x,y+3);ctx.fillText(f.name.split(' ')[0],x,y-20);});

        if(activeDispatch){
            const rider=activeDispatch.rider,path=activeDispatch.currentPath;
            if(path&&path.length>0){
                let rx,ry;
                if(activeDispatch.phase==='waiting'){
                    const b=path[path.length-1];[rx,ry]=latLngToXY(b.lat,b.lng);
                    const pr=8+Math.sin(Date.now()/150)*4;ctx.beginPath();ctx.arc(rx,ry,pr,0,Math.PI*2);ctx.strokeStyle='#f59e0b';ctx.lineWidth=2;ctx.stroke();
                }else{
                    const idx=activeDispatch.nodeIndex;
                    if(idx<path.length-1){
                        const[x1,y1]=latLngToXY(path[idx].lat,path[idx].lng),[x2,y2]=latLngToXY(path[idx+1].lat,path[idx+1].lng);
                        rx=x1+(x2-x1)*activeDispatch.progress;ry=y1+(y2-y1)*activeDispatch.progress;
                        activeDispatch.progress+=0.04;if(activeDispatch.progress>=1){activeDispatch.progress=0;activeDispatch.nodeIndex++;}
                    }else{
                        if(activeDispatch.phase==='pickup'){
                            activeDispatch.phase='waiting';activeDispatch.timer=80;
                            logDispatch(`📦 ${rider.name} arrived at blood bank. Collecting ${activeDispatch.units} units of ${activeDispatch.bloodType}...`);
                            rider.status=`Loading at ${activeDispatch.bloodBank.name}`;
                            const ms=document.getElementById('mission-status');if(ms)ms.innerHTML='📦 Warrior at Blood Bank — loading blood cargo...';
                        }else if(activeDispatch.phase==='delivery'){
                            activeDispatch.phase='completed';
                            logDispatch(`✅ DELIVERED! ${rider.name} handed over ${activeDispatch.units} units of ${activeDispatch.bloodType} to ${activeDispatch.hospital.name}`);
                            const ms=document.getElementById('mission-status');if(ms){ms.style.color='#22c55e';ms.innerHTML='✅ Mission Complete — Blood delivered successfully!';}
                            rider.status="Idle";rider.lat=activeDispatch.hospital.lat;rider.lng=activeDispatch.hospital.lng;rider.zone=activeDispatch.hospital.zone;
                            document.getElementById('dispatch-indicator').textContent="All Riders Idle";document.getElementById('dispatch-indicator').className="tag tag-primary";
                            activeDispatch=null;
                        }
                    }
                }
                if(activeDispatch&&activeDispatch.phase!=='completed'){
                    ctx.beginPath();ctx.arc(rx,ry,12,0,Math.PI*2);ctx.fillStyle=rider.color;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
                    ctx.fillStyle='#fff';ctx.font='bold 10px Inter';ctx.fillText('🏍️ '+rider.name,rx,ry-16);
                }
            }
        }

        riders.forEach(r=>{if(activeDispatch&&activeDispatch.rider.name===r.name)return;const[x,y]=latLngToXY(r.lat,r.lng);
            ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fillStyle=r.color;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();
            ctx.fillStyle='rgba(255,255,255,0.7)';ctx.font='9px Inter';ctx.fillText('🏍️ '+r.name,x,y-10);});

        if(activeDispatch&&activeDispatch.phase==='waiting'){
            activeDispatch.timer--;
            if(activeDispatch.timer<=0){
                activeDispatch.phase='delivery';activeDispatch.currentPath=activeDispatch.path2;activeDispatch.nodeIndex=0;activeDispatch.progress=0;
                const r=activeDispatch.rider;
                logDispatch(`🚚 ${r.name} departing blood bank → delivering to ${activeDispatch.hospital.name}`);
                r.status=`In Transit → ${activeDispatch.hospital.name}`;
                const ms=document.getElementById('mission-status');if(ms){ms.style.color='#14b8a6';ms.innerHTML='🚚 Blood cargo loaded — Warrior in transit to Hospital...';}
            }
        }
        mapAnimationId=requestAnimationFrame(drawMap);
    }
    drawMap();
    window.addEventListener('resize',resizeCanvas);

    document.getElementById('btn-dispatch-rider').addEventListener('click', async ()=>{
        if(activeDispatch){alert("A dispatch is active. Wait for completion.");return;}
        const destId=document.getElementById('dispatch-dest').value;
        const bloodType=document.getElementById('dispatch-blood-type').value;
        const units=parseInt(document.getElementById('dispatch-units').value);
        const hospital=facilities.find(f=>f.id===destId);

        logDispatch(`🚨 EMERGENCY: ${units} units of ${bloodType} needed at ${hospital.name}`);

        const banksRes=await api.get(`/api/blood-banks?blood_type=${bloodType}`);
        if(!banksRes||banksRes.length===0){logDispatch(`❌ No blood banks have ${bloodType} in stock.`);return;}

        const bankMeta=banksRes[0];
        const bankNode=facilities.find(f=>f.name.includes(bankMeta.name.split(' ')[0]));
        const bankCoord=bankNode?{lat:bankNode.lat,lng:bankNode.lng,name:bankNode.name,phone:bankNode.phone}:{lat:bankMeta.latitude,lng:bankMeta.longitude,name:bankMeta.name,phone:bankMeta.contact_phone};

        logDispatch(`🔍 Stock found at ${bankCoord.name} (${bankMeta.inventory[bloodType]} units available)`);

        let bestRider=null,minDist=Infinity;
        riders.forEach(r=>{if(r.status==="Idle"){const d=Math.sqrt((r.lat-bankCoord.lat)**2+(r.lng-bankCoord.lng)**2);if(d<minDist){minDist=d;bestRider=r;}}});
        if(!bestRider){logDispatch(`⚠️ All warriors occupied. Request queued.`);return;}

        logDispatch(`🏍️ Assigning ${bestRider.name} (📞 ${bestRider.phone}) to mission`);
        bestRider.status=`En Route → ${bankCoord.name}`;
        document.getElementById('dispatch-indicator').textContent=`🔴 LIVE: ${bestRider.name}`;
        document.getElementById('dispatch-indicator').className="tag tag-accent";

        const seg1=await api.get(`/api/analytics/routing/find?olat=${bestRider.lat}&olng=${bestRider.lng}&dlat=${bankCoord.lat}&dlng=${bankCoord.lng}`);
        const seg2=await api.get(`/api/analytics/routing/find?olat=${bankCoord.lat}&olng=${bankCoord.lng}&dlat=${hospital.lat}&dlng=${hospital.lng}`);

        if(seg1&&seg2){
            const totalDist=(seg1.distance_km+seg2.distance_km).toFixed(1);
            const totalEta=(seg1.estimated_time_minutes+seg2.estimated_time_minutes).toFixed(0);
            showMissionBriefing(bestRider,bankCoord.name,bankCoord.phone,hospital,bloodType,units,totalDist,totalEta);
            logDispatch(`📋 Mission briefing sent to ${bestRider.name} via WhatsApp`);
            logDispatch(`🗺️ Route: ${bestRider.zone.toUpperCase()} ➤ ${bankCoord.name} ➤ ${hospital.name} (${totalDist} km, ~${totalEta} min)`);

            activeDispatch={rider:bestRider,bloodBank:bankCoord,hospital,bloodType,units,path1:seg1.path,path2:seg2.path,currentPath:seg1.path,nodeIndex:0,progress:0,phase:'pickup',timer:0};
        }else{logDispatch(`❌ Routing failed.`);bestRider.status="Idle";}
    });
}
