"""
Semantic Matching Agent — Finds optimal donor-to-patient matches using vector similarity,
blood compatibility, geo-proximity, and behavioral reliability scoring.
"""
import time
import numpy as np
from typing import List, Dict, Any, Optional
from backend.services.vector_store import vector_store
from backend.services.digital_twin import digital_twin_engine
from backend.services.geo_engine import geo_engine


class SemanticMatchingAgent:
    """
    Agent 1: Semantic Matching Agent (SMA)
    Objective: Find optimal donor-to-patient matches using multi-factor semantic similarity.
    Pipeline: ABO Filter → Vector Search → Geo-Proximity → Reliability Score → Re-rank
    """

    COMPATIBILITY_MATRIX = {
        "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
        "O+": ["O+", "A+", "B+", "AB+"],
        "A-": ["A-", "A+", "AB-", "AB+"],
        "A+": ["A+", "AB+"],
        "B-": ["B-", "B+", "AB-", "AB+"],
        "B+": ["B+", "AB+"],
        "AB-": ["AB-", "AB+"],
        "AB+": ["AB+"],
    }

    URGENCY_WEIGHTS = {
        "critical": {"compatibility": 0.35, "proximity": 0.30, "reliability": 0.20, "availability": 0.15},
        "urgent": {"compatibility": 0.30, "proximity": 0.25, "reliability": 0.25, "availability": 0.20},
        "normal": {"compatibility": 0.25, "proximity": 0.20, "reliability": 0.30, "availability": 0.25},
        "scheduled": {"compatibility": 0.20, "proximity": 0.15, "reliability": 0.35, "availability": 0.30},
    }

    def find_matches(self, blood_type: str, latitude: float, longitude: float,
                     urgency: str = "normal", units_needed: int = 1,
                     max_distance_km: float = 50.0, top_k: int = 10) -> Dict[str, Any]:
        start_time = time.time()
        reasoning = [f"🔍 Initiating semantic match for {blood_type} ({urgency} urgency)",
                     f"📍 Search center: ({latitude:.4f}, {longitude:.4f}), radius: {max_distance_km}km"]

        # Step 1: Find compatible donor blood types
        compatible_types = []
        for donor_type, can_give_to in self.COMPATIBILITY_MATRIX.items():
            if blood_type in can_give_to:
                compatible_types.append(donor_type)
        reasoning.append(f"🩸 Compatible donor types: {', '.join(compatible_types)}")

        # Step 2: Vector similarity search
        query_profile = {"blood_type": blood_type, "latitude": latitude, "longitude": longitude,
                         "reliability_score": 1.0, "engagement_score": 1.0, "risk_score": 0.0, "availability_score": 1.0}
        candidates = vector_store.search(query_profile, top_k=50,
                                         filters={"is_eligible": True, "is_active": True})
        reasoning.append(f"🔎 Vector search returned {len(candidates)} candidates")

        # Step 3: Filter by compatibility + distance
        weights = self.URGENCY_WEIGHTS.get(urgency, self.URGENCY_WEIGHTS["normal"])
        matches = []
        for candidate in candidates:
            meta = candidate["metadata"]
            donor_type = meta.get("blood_type", "")
            if donor_type not in compatible_types:
                continue
            dist = geo_engine.haversine_distance(latitude, longitude,
                                                  meta.get("latitude", 0), meta.get("longitude", 0))
            if dist > max_distance_km:
                continue
            # Multi-factor scoring
            compat_score = 1.0 if donor_type == blood_type else 0.8
            prox_score = max(0, 1 - dist / max_distance_km)
            reliability = meta.get("reliability_score", 0.5)
            availability = meta.get("availability_score", 0.8)
            final_score = (compat_score * weights["compatibility"] + prox_score * weights["proximity"] +
                          reliability * weights["reliability"] + availability * weights["availability"])
            eta = dist / geo_engine.avg_speed_kmh * 60
            matches.append({
                "donor_id": candidate["id"], "donor_name": meta.get("name", "Unknown"),
                "blood_type": donor_type, "match_score": round(final_score, 3),
                "compatibility_score": round(compat_score, 3), "proximity_score": round(prox_score, 3),
                "reliability_score": round(reliability, 3), "availability_score": round(availability, 3),
                "distance_km": round(dist, 2), "estimated_eta_minutes": round(eta, 1),
                "donor_location": {"lat": meta.get("latitude", 0), "lng": meta.get("longitude", 0)},
                "phone": meta.get("phone", ""),
                "email": meta.get("email", ""),
            })

        matches.sort(key=lambda x: x["match_score"], reverse=True)
        matches = matches[:top_k]
        elapsed = (time.time() - start_time) * 1000

        if matches:
            reasoning.append(f"✅ Found {len(matches)} matches. Best: {matches[0]['donor_name']} (score: {matches[0]['match_score']})")
        else:
            reasoning.append("⚠️ No compatible donors found in range. Expanding search recommended.")

        return {
            "request_id": f"match-{int(time.time())}", "blood_type": blood_type,
            "urgency": urgency, "total_candidates": len(candidates),
            "matches": matches, "agent_reasoning": reasoning,
            "processing_time_ms": round(elapsed, 2),
            "weights_used": weights,
        }


semantic_matching_agent = SemanticMatchingAgent()
