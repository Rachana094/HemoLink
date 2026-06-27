"""
WhatsApp Webhook — Dual-mode: Twilio Sandbox (testing) + Meta Cloud API (production)
---
For TESTING on your phone RIGHT NOW: Use Twilio Sandbox + ngrok (free, 5 min setup)
For PRODUCTION like Namma Metro: Use Meta WhatsApp Business Cloud API
"""
from fastapi import APIRouter, Request, Response, Form
from typing import Dict, Optional
from datetime import datetime
import os

from backend.services.prediction_engine import prediction_engine
from backend.services.ocr_pipeline import ocr_pipeline
from backend.services.rag_engine import rag_engine
from backend.agents.semantic_matching_agent import semantic_matching_agent
from backend.api.blood_banks import blood_banks_db

router = APIRouter(prefix="/api/whatsapp", tags=["WhatsApp"])

# In-memory stores
whatsapp_logs = []
whatsapp_sessions: Dict[str, dict] = {}

# Config (set via environment variables)
VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "hemolink_verify_token")
ACCESS_TOKEN = os.getenv("WHATSAPP_TOKEN", "")          # Meta Cloud API token
PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")  # Meta phone number ID


# ─────────────────────────────────────────────────────────
# META CLOUD API WEBHOOK (Production — like Namma Metro)
# ─────────────────────────────────────────────────────────

@router.get("/webhook")
async def verify_webhook(request: Request):
    """Meta Webhook Verification (GET) — confirms webhook URL to Meta."""
    params = request.query_params
    if params.get("hub.mode") == "subscribe" and params.get("hub.verify_token") == VERIFY_TOKEN:
        return Response(content=params.get("hub.challenge", ""), media_type="text/plain")
    return Response(content="Forbidden", status_code=403)


@router.post("/webhook")
async def receive_meta_message(request: Request):
    """Meta Cloud API Webhook (POST) — receives JSON from graph.facebook.com"""
    try:
        body = await request.json()
        entry = body.get("entry", [{}])[0]
        changes = entry.get("changes", [{}])[0]
        value = changes.get("value", {})
        messages = value.get("messages", [])
        if not messages:
            return {"status": "ok"}
        msg = messages[0]
        sender = msg.get("from", "unknown")
        text = msg.get("text", {}).get("body", "").strip()
    except Exception:
        return {"status": "ok"}

    if not text:
        return {"status": "ok"}

    reply_text = await _process_message(sender, text)
    await _send_meta_reply(sender, reply_text)
    _save_log(sender, text, reply_text)
    return {"status": "ok"}


# ─────────────────────────────────────────────────────────
# TWILIO SANDBOX WEBHOOK (Testing — free, instant setup)
# ─────────────────────────────────────────────────────────

@router.post("/twilio")
async def receive_twilio_message(
    From: str = Form(...),
    Body: str = Form(...)
):
    """Twilio WhatsApp Sandbox Webhook — receives form data from Twilio.
    
    Set this as your Twilio Sandbox webhook URL:
    https://<your-ngrok-url>/api/whatsapp/twilio
    """
    sender = From.replace("whatsapp:", "")  # strips 'whatsapp:+91...' prefix
    text = Body.strip()

    reply_text = await _process_message(sender, text)
    _save_log(sender, text, reply_text)

    # Return TwiML XML response — Twilio sends this back to the user
    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>{reply_text}</Message>
</Response>"""
    return Response(content=twiml, media_type="application/xml")


# ─────────────────────────────────────────────────────────
# SHARED STATE MACHINE
# ─────────────────────────────────────────────────────────

async def _process_message(sender: str, text: str) -> str:
    """Conversation state machine — handles both Twilio and Meta messages."""
    cleaned = text.lower().strip()
    session = whatsapp_sessions.get(sender, {"step": "menu"})
    step = session["step"]
    reply = ""

    # Always allow reset
    if cleaned in ["hi", "hello", "menu", "reset", "start", "hemolink"]:
        session["step"] = "menu"
        reply = (
            "Hi! I'm the *HemoLink AI Assistant* 🩸\n\n"
            "I can help you with:\n\n"
            "1️⃣ Find compatible donors\n"
            "2️⃣ Check blood stock levels\n"
            "3️⃣ Safety & compliance guidelines\n"
            "4️⃣ Scan blood report (OCR)\n\n"
            "Reply with a number to get started."
        )

    elif step == "menu":
        if cleaned == "1" or "donor" in cleaned:
            session["step"] = "wait_blood_type"
            reply = (
                "Please enter the blood type needed:\n\n"
                "O+  O-  A+  A-  B+  B-  AB+  AB-\n\n"
                "Example: just type *O+*"
            )
        elif cleaned == "2" or "stock" in cleaned or "inventory" in cleaned:
            inventory = {"A+": 45, "A-": 8, "B+": 52, "B-": 5, "AB+": 12, "AB-": 2, "O+": 65, "O-": 7}
            alerts = prediction_engine.predict_shortages(inventory)
            reply = "📊 *Current Blood Stock — Bangalore*\n\n"
            for bt, count in inventory.items():
                icon = "🚨" if count < 10 else "⚠️" if count < 30 else "✅"
                reply += f"{icon} *{bt}*: {count} units\n"
            critical = [a["blood_type"] for a in alerts if a["risk_level"] == "critical"]
            if critical:
                reply += f"\n⚠️ *CRITICAL SHORTAGE:* {', '.join(critical)}"
            reply += "\n\nReply *menu* to go back."

        elif cleaned == "3" or "safety" in cleaned or "guideline" in cleaned:
            session["step"] = "wait_rag"
            reply = (
                "📚 Ask me any question about blood donation:\n\n"
                "Example questions:\n"
                "• Who is the universal donor?\n"
                "• What is the age limit?\n"
                "• How long can blood be stored?\n\n"
                "Just type your question 👇"
            )

        elif cleaned == "4" or "scan" in cleaned or "ocr" in cleaned or "report" in cleaned:
            res = ocr_pipeline.process_document("blood_report")
            e = res.get("extracted_entities", {})
            reply = (
                f"📄 *Lab Report Digitized*\n\n"
                f"👤 *Patient:* {e.get('patient_name', 'N/A')}\n"
                f"🩸 *Blood Group:* {e.get('blood_group', 'N/A')}\n"
                f"💊 *Hemoglobin:* {e.get('hemoglobin', 'N/A')} g/dL\n"
                f"⚥ *Age/Gender:* {e.get('age', 'N/A')} / {e.get('gender', 'N/A')}\n\n"
                f"✅ Confidence: {int(res.get('confidence_score', 0.95) * 100)}%\n\n"
                f"Reply *menu* to go back."
            )
        else:
            # Fallback to RAG
            res = rag_engine.query(text)
            sources = ", ".join([s["title"] for s in res.get("sources", [])])
            reply = f"{res.get('answer', 'I could not find an answer.')}\n\n_Sources: {sources}_\n\nReply *menu* to go back."

    elif step == "wait_blood_type":
        bt = cleaned.upper().replace(" ", "")
        valid = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
        if bt not in valid:
            reply = f"⚠️ '{bt}' is not a valid blood type.\n\nPlease enter one of:\nO+  O-  A+  A-  B+  B-  AB+  AB-"
        else:
            res = semantic_matching_agent.find_matches(
                blood_type=bt, latitude=12.9716, longitude=77.5946,
                urgency="critical", units_needed=1, max_distance_km=40.0, top_k=3
            )
            matches = res.get("matches", [])
            if matches:
                reply = f"🔍 *Top Donors for {bt}* (within 40km)\n\n"
                for i, m in enumerate(matches[:3]):
                    ph = "".join(filter(str.isdigit, m.get("phone", "")))
                    reply += (
                        f"{i+1}. *{m['donor_name']}*\n"
                        f"   Match: {int(m['match_score']*100)}% · {m['distance_km']} km away\n"
                        f"   📞 {m['phone']}\n"
                        f"   💬 wa.me/{ph}\n\n"
                    )
                # Nearest blood bank with stock
                banks = [b for b in blood_banks_db.values() if b["inventory"].get(bt, 0) > 0]
                if banks:
                    b = banks[0]
                    reply += (
                        f"🏥 *Nearest Blood Bank*\n"
                        f"{b['name']}\n"
                        f"📞 {b['contact_phone']}\n"
                        f"🩸 Stock: {b['inventory'][bt]} units of {bt}"
                    )
            else:
                reply = f"⚠️ No compatible donors found for *{bt}* in the 40km radius.\n\nTry a different blood type or expand the search."
            reply += "\n\nReply *menu* to go back."
            session["step"] = "menu"

    elif step == "wait_rag":
        res = rag_engine.query(text)
        sources = ", ".join([s["title"] for s in res.get("sources", [])])
        reply = (
            f"📚 *HemoLink Safety Response*\n\n"
            f"{res.get('answer', 'No answer found.')}\n\n"
            f"_Sources: {sources}_\n\n"
            f"Reply *menu* to go back."
        )
        session["step"] = "menu"

    else:
        session["step"] = "menu"
        reply = "Reply *menu* to see options."

    whatsapp_sessions[sender] = session
    return reply


def _save_log(sender: str, text: str, reply: str):
    """Save message exchange to in-memory log."""
    whatsapp_logs.append({
        "timestamp": datetime.now().strftime("%I:%M %p"),
        "from": sender,
        "body": text,
        "reply": reply
    })
    if len(whatsapp_logs) > 100:
        whatsapp_logs.pop(0)


async def _send_meta_reply(to: str, text: str):
    """Send reply via Meta WhatsApp Cloud API (production mode)."""
    if not ACCESS_TOKEN or not PHONE_NUMBER_ID:
        return  # Simulation mode — no token configured
    try:
        import httpx
        url = f"https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages"
        headers = {"Authorization": f"Bearer {ACCESS_TOKEN}", "Content-Type": "application/json"}
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": text, "preview_url": False}
        }
        async with httpx.AsyncClient() as client:
            await client.post(url, json=payload, headers=headers)
    except Exception:
        pass


# ─────────────────────────────────────────────────────────
# LOGS API
# ─────────────────────────────────────────────────────────

@router.get("/logs")
async def get_whatsapp_logs():
    """Retrieve all webhook message logs."""
    return {"logs": whatsapp_logs}


@router.post("/logs/clear")
async def clear_whatsapp_logs():
    """Clear stored logs."""
    global whatsapp_logs
    whatsapp_logs = []
    return {"status": "success"}
