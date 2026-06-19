"""
Donor API Routes — CRUD + Digital Twin + Semantic Search
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from backend.schemas.schemas import DonorCreate, DonorResponse, DonorDigitalTwin
from backend.services.vector_store import vector_store
from backend.services.digital_twin import digital_twin_engine
import uuid
from datetime import datetime, timedelta
import numpy as np

router = APIRouter(prefix="/api/donors", tags=["Donors"])

# In-memory store (replace with DB in production)
donors_db: dict = {}


def _seed_donors():
    """Seed realistic donor data for demo."""
    if donors_db:
        return
    np.random.seed(42)
    names = [
        ("Rajesh Kumar", "M", "B+", 12.9352, 77.6245, "Bangalore", "Karnataka", 34, 8),
        ("Ananya Sharma", "F", "O+", 12.9784, 77.6408, "Bangalore", "Karnataka", 28, 12),
        ("Vikram Patel", "M", "A+", 12.9698, 77.7500, "Bangalore", "Karnataka", 42, 5),
        ("Priya Nair", "F", "O-", 12.9300, 77.5838, "Bangalore", "Karnataka", 31, 15),
        ("Arjun Reddy", "M", "B+", 12.8399, 77.6770, "Bangalore", "Karnataka", 25, 3),
        ("Meera Devi", "F", "A-", 12.9969, 77.5700, "Bangalore", "Karnataka", 38, 7),
        ("Suresh Iyer", "M", "AB+", 13.0358, 77.5970, "Bangalore", "Karnataka", 45, 20),
        ("Kavitha Rao", "F", "O+", 12.9166, 77.6101, "Bangalore", "Karnataka", 29, 9),
        ("Deepak Singh", "M", "B-", 12.9116, 77.6389, "Bangalore", "Karnataka", 36, 2),
        ("Lakshmi Menon", "F", "A+", 12.9591, 77.7009, "Bangalore", "Karnataka", 33, 11),
        ("Amit Joshi", "M", "O+", 12.9757, 77.6063, "Bangalore", "Karnataka", 27, 6),
        ("Fatima Khan", "F", "B+", 12.9716, 77.5946, "Bangalore", "Karnataka", 30, 14),
        ("Ravi Prasad", "M", "AB-", 13.1007, 77.5963, "Bangalore", "Karnataka", 40, 1),
        ("Sneha Kulkarni", "F", "O+", 12.8700, 77.5964, "Bangalore", "Karnataka", 24, 4),
        ("Mohammed Ali", "M", "A+", 13.0098, 77.6960, "Bangalore", "Karnataka", 35, 10),
        ("Divya Hegde", "F", "B+", 12.9063, 77.5857, "Bangalore", "Karnataka", 32, 8),
        ("Karthik Gowda", "M", "O-", 12.9400, 77.6100, "Bangalore", "Karnataka", 29, 16),
        ("Asha Bhat", "F", "A+", 12.9550, 77.5800, "Bangalore", "Karnataka", 37, 6),
        ("Naveen Kumar", "M", "B+", 12.9800, 77.6600, "Bangalore", "Karnataka", 26, 3),
        ("Rekha Shetty", "F", "AB+", 12.9650, 77.5500, "Bangalore", "Karnataka", 41, 9),
    ]
    for name, gender, bt, lat, lng, city, state, age, donations in names:
        did = str(uuid.uuid4())
        last_don = datetime.now() - timedelta(days=np.random.randint(30, 300))
        no_shows = np.random.randint(0, 3)
        resp_rate = round(np.random.uniform(0.6, 1.0), 2)
        donor = {
            "id": did, "name": name, "email": f"{name.lower().replace(' ', '.')}@email.com",
            "phone": f"+91{np.random.randint(70000, 99999)}{np.random.randint(10000, 99999)}", "age": age,
            "gender": gender, "blood_type": bt, "rh_factor": "+" if "+" in bt else "-",
            "latitude": lat + np.random.uniform(-0.01, 0.01),
            "longitude": lng + np.random.uniform(-0.01, 0.01),
            "city": city, "state": state, "district": "Bangalore Urban",
            "total_donations": donations, "last_donation_date": last_don.isoformat(),
            "no_show_count": no_shows, "response_rate": resp_rate,
            "is_eligible": True, "is_active": True, "is_verified": True,
            "weight_kg": round(np.random.uniform(52, 90), 1),
            "hemoglobin_level": round(np.random.uniform(12.0, 16.5), 1),
            "medical_conditions": [], "medications": [],
            "preferred_donation_time": np.random.choice(["morning", "afternoon", "evening"]),
            "preferred_contact_method": np.random.choice(["sms", "whatsapp", "call", "email"]),
            "max_travel_distance_km": round(np.random.uniform(5, 25), 1),
            "activity_timeline": [],
            "created_at": (datetime.now() - timedelta(days=np.random.randint(100, 1000))).isoformat(),
        }
        # Compute digital twin scores
        twin = digital_twin_engine.generate_full_twin(donor)
        donor["reliability_score"] = twin["reliability_score"]
        donor["engagement_score"] = twin["engagement_score"]
        donor["risk_score"] = twin["risk_score"]
        donor["availability_score"] = twin["availability_score"]
        donor["churn_risk"] = twin["churn_risk"]

        donors_db[did] = donor
        vector_store.add_profile(did, donor)


_seed_donors()


@router.get("/", response_model=List[DonorResponse])
async def list_donors(limit: int = 50, blood_type: Optional[str] = None):
    donors = list(donors_db.values())
    if blood_type:
        donors = [d for d in donors if d["blood_type"] == blood_type]
    return donors[:limit]


@router.get("/{donor_id}")
async def get_donor(donor_id: str):
    if donor_id not in donors_db:
        raise HTTPException(404, "Donor not found")
    return donors_db[donor_id]


@router.get("/{donor_id}/digital-twin")
async def get_digital_twin(donor_id: str):
    if donor_id not in donors_db:
        raise HTTPException(404, "Donor not found")
    return digital_twin_engine.generate_full_twin(donors_db[donor_id])


@router.post("/", response_model=DonorResponse)
async def create_donor(donor: DonorCreate):
    did = str(uuid.uuid4())
    data = donor.model_dump()
    data["id"] = did
    data.update({"total_donations": 0, "no_show_count": 0, "response_rate": 1.0,
                 "is_eligible": True, "is_active": True, "is_verified": False,
                 "medical_conditions": [], "activity_timeline": [],
                 "churn_risk": 0.5, "created_at": datetime.now().isoformat()})
    twin = digital_twin_engine.generate_full_twin(data)
    data.update({k: twin[k] for k in ["reliability_score", "engagement_score", "risk_score", "availability_score"]})
    donors_db[did] = data
    vector_store.add_profile(did, data)
    return data


@router.get("/search/semantic")
async def semantic_search(blood_type: str, lat: float = 12.97, lng: float = 77.59, top_k: int = 10):
    query = {"blood_type": blood_type, "latitude": lat, "longitude": lng,
             "reliability_score": 1.0, "engagement_score": 1.0, "risk_score": 0.0, "availability_score": 1.0}
    results = vector_store.search(query, top_k=top_k, filters={"blood_type_compatible": blood_type})
    return {"query": {"blood_type": blood_type, "lat": lat, "lng": lng},
            "results": results, "total": len(results), "engine": "ChromaDB (simulated)"}
