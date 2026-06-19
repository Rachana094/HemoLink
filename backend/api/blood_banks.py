"""
Blood Bank & Hospital Registry API Routes
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
import uuid
import numpy as np

router = APIRouter(prefix="/api/blood-banks", tags=["Blood Banks"])

# In-memory store matching the BloodBank schema
blood_banks_db = {}

def _seed_blood_banks():
    if blood_banks_db:
        return
    
    banks = [
        {
            "name": "Rotary Bangalore TTK Blood Bank",
            "type": "standalone",
            "latitude": 12.9784,
            "longitude": 77.6408,
            "address": "Indiranagar, Bangalore",
            "city": "Bangalore",
            "state": "Karnataka",
            "operating_hours": "24/7",
            "contact_phone": "+918025287903",
            "contact_email": "info@rotaryttk.org",
            "inventory": {"A+": 42, "A-": 8, "B+": 55, "B-": 12, "AB+": 18, "AB-": 4, "O+": 60, "O-": 15},
            "total_capacity": 500,
            "current_stock": 214,
            "wastage_rate": 0.05,
            "fulfillment_rate": 0.94,
        },
        {
            "name": "Victoria Hospital Blood Bank",
            "type": "hospital",
            "latitude": 12.9645,
            "longitude": 77.5760,
            "address": "K.R. Market, Bangalore",
            "city": "Bangalore",
            "state": "Karnataka",
            "operating_hours": "24/7",
            "contact_phone": "+918026701111",
            "contact_email": "victoria.bloodbank@karnataka.gov.in",
            "inventory": {"A+": 25, "A-": 2, "B+": 12, "B-": 4, "AB+": 10, "AB-": 1, "O+": 35, "O-": 6},
            "total_capacity": 300,
            "current_stock": 95,
            "wastage_rate": 0.08,
            "fulfillment_rate": 0.88,
        },
        {
            "name": "Red Cross Society Blood Bank",
            "type": "standalone",
            "latitude": 12.9757,
            "longitude": 77.6063,
            "address": "Race Course Road, Bengaluru",
            "city": "Bangalore",
            "state": "Karnataka",
            "operating_hours": "24/7",
            "contact_phone": "+918022268435",
            "contact_email": "redcross.kar@gmail.com",
            "inventory": {"A+": 30, "A-": 5, "B+": 40, "B-": 9, "AB+": 14, "AB-": 3, "O+": 45, "O-": 8},
            "total_capacity": 400,
            "current_stock": 194,
            "wastage_rate": 0.06,
            "fulfillment_rate": 0.91,
        },
        {
            "name": "St. John's Medical College Hospital Blood Bank",
            "type": "hospital",
            "latitude": 12.9322,
            "longitude": 77.6244,
            "address": "Koramangala, Bangalore",
            "city": "Bangalore",
            "state": "Karnataka",
            "operating_hours": "24/7",
            "contact_phone": "+918022065000",
            "contact_email": "stjohns.bloodbank@stjohns.in",
            "inventory": {"A+": 50, "A-": 10, "B+": 70, "B-": 16, "AB+": 24, "AB-": 6, "O+": 85, "O-": 20},
            "total_capacity": 600,
            "current_stock": 281,
            "wastage_rate": 0.04,
            "fulfillment_rate": 0.96,
        },
        {
            "name": "Rashtrotthana Blood Bank",
            "type": "standalone",
            "latitude": 12.9300,
            "longitude": 77.5838,
            "address": "Jayanagar, Bangalore",
            "city": "Bangalore",
            "state": "Karnataka",
            "operating_hours": "24/7",
            "contact_phone": "+918026612730",
            "contact_email": "contact@rashtrotthana.org",
            "inventory": {"A+": 38, "A-": 6, "B+": 48, "B-": 10, "AB+": 20, "AB-": 5, "O+": 55, "O-": 12},
            "total_capacity": 450,
            "current_stock": 194,
            "wastage_rate": 0.05,
            "fulfillment_rate": 0.93,
        }
    ]

    for bank in banks:
        bid = str(uuid.uuid4())
        bank["id"] = bid
        bank["is_active"] = True
        blood_banks_db[bid] = bank

_seed_blood_banks()

@router.get("/")
async def list_blood_banks(blood_type: Optional[str] = None):
    results = list(blood_banks_db.values())
    if blood_type:
        # Sort or filter by banks that have positive stock of that blood type
        results = [b for b in results if b["inventory"].get(blood_type, 0) > 0]
    return results

@router.post("/request")
async def request_from_blood_bank(request_data: dict):
    bank_id = request_data.get("bank_id")
    blood_type = request_data.get("blood_type")
    units = request_data.get("units_requested", 1)
    
    if bank_id not in blood_banks_db:
        raise HTTPException(status_code=404, detail="Blood bank not found")
        
    bank = blood_banks_db[bank_id]
    current_stock = bank["inventory"].get(blood_type, 0)
    
    if current_stock < units:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient stock at {bank['name']}. Current stock: {current_stock} units."
        )
        
    # Deduct stock
    bank["inventory"][blood_type] -= units
    bank["current_stock"] -= units
    
    return {
        "status": "success",
        "message": f"Successfully requisitioned {units} units of {blood_type} from {bank['name']}.",
        "bank_name": bank["name"],
        "contact_phone": bank["contact_phone"],
        "contact_email": bank["contact_email"],
        "remaining_stock": bank["inventory"][blood_type]
    }
