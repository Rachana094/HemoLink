"""
HemoLink Digital Twin Engine — Profile scoring and update system.
Manages comprehensive digital twin profiles for donors and patients.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import numpy as np


class DigitalTwinEngine:
    """Computes and updates Digital Twin scoring dimensions."""

    def compute_reliability_score(self, total_donations: int, no_shows: int, response_rate: float) -> float:
        if total_donations == 0:
            return 0.5
        show_rate = 1 - (no_shows / max(total_donations + no_shows, 1))
        donation_factor = min(1.0, total_donations / 10)
        return round(show_rate * 0.4 + donation_factor * 0.3 + response_rate * 0.3, 3)

    def compute_engagement_score(self, total_donations: int, last_donation_days_ago: Optional[int], response_rate: float) -> float:
        recency = 0.5
        if last_donation_days_ago is not None:
            recency = max(0, 1 - last_donation_days_ago / 365)
        frequency = min(1.0, total_donations / 8)
        return round(recency * 0.4 + frequency * 0.35 + response_rate * 0.25, 3)

    def compute_risk_score(self, age: int, weight_kg: Optional[float], hemoglobin: Optional[float], medical_conditions: List) -> float:
        risk = 0.1
        if age < 20 or age > 55:
            risk += 0.15
        if weight_kg and weight_kg < 50:
            risk += 0.2
        if hemoglobin and hemoglobin < 12.5:
            risk += 0.25
        if medical_conditions:
            risk += len(medical_conditions) * 0.1
        return round(min(1.0, risk), 3)

    def compute_availability_score(self, is_eligible: bool, last_donation_days_ago: Optional[int], preferred_time: str) -> float:
        if not is_eligible:
            return 0.0
        base = 0.8
        if last_donation_days_ago is not None and last_donation_days_ago < 90:
            base = 0.2
        elif last_donation_days_ago is not None and last_donation_days_ago < 120:
            base = 0.5
        return round(base, 3)

    def compute_churn_risk(self, total_donations: int, last_donation_days_ago: Optional[int], no_shows: int) -> float:
        if total_donations == 0:
            return 0.6
        recency_risk = 0.0
        if last_donation_days_ago:
            recency_risk = min(1.0, last_donation_days_ago / 365)
        frequency_factor = max(0, 1 - total_donations / 10)
        no_show_factor = min(1.0, no_shows / 3)
        return round(recency_risk * 0.4 + frequency_factor * 0.3 + no_show_factor * 0.3, 3)

    def compute_composite_score(self, reliability: float, engagement: float, risk: float, availability: float) -> float:
        return round(reliability * 0.3 + engagement * 0.25 + (1 - risk) * 0.2 + availability * 0.25, 3)

    def generate_full_twin(self, donor_data: Dict[str, Any]) -> Dict[str, Any]:
        last_days = None
        if donor_data.get("last_donation_date"):
            try:
                ld = datetime.fromisoformat(str(donor_data["last_donation_date"]).replace("None", ""))
                last_days = (datetime.now() - ld).days
            except (ValueError, TypeError):
                last_days = None

        reliability = self.compute_reliability_score(
            donor_data.get("total_donations", 0),
            donor_data.get("no_show_count", 0),
            donor_data.get("response_rate", 1.0)
        )
        engagement = self.compute_engagement_score(
            donor_data.get("total_donations", 0), last_days,
            donor_data.get("response_rate", 1.0)
        )
        risk = self.compute_risk_score(
            donor_data.get("age", 30), donor_data.get("weight_kg"),
            donor_data.get("hemoglobin_level"), donor_data.get("medical_conditions", [])
        )
        availability = self.compute_availability_score(
            donor_data.get("is_eligible", True), last_days,
            donor_data.get("preferred_donation_time", "morning")
        )
        churn = self.compute_churn_risk(
            donor_data.get("total_donations", 0), last_days,
            donor_data.get("no_show_count", 0)
        )
        composite = self.compute_composite_score(reliability, engagement, risk, availability)

        return {
            "donor_id": donor_data.get("id", "unknown"),
            "name": donor_data.get("name", "Unknown"),
            "blood_type": donor_data.get("blood_type", "O+"),
            "reliability_score": reliability,
            "engagement_score": engagement,
            "risk_score": risk,
            "availability_score": availability,
            "churn_risk": churn,
            "composite_score": composite,
            "total_donations": donor_data.get("total_donations", 0),
            "preference_vector": {
                "time": donor_data.get("preferred_donation_time", "morning"),
                "location": donor_data.get("preferred_location_type", "hospital"),
                "contact": donor_data.get("preferred_contact_method", "sms"),
                "max_distance_km": donor_data.get("max_travel_distance_km", 10.0),
            },
            "scoring_breakdown": {
                "reliability": {"weight": 0.3, "value": reliability},
                "engagement": {"weight": 0.25, "value": engagement},
                "safety": {"weight": 0.2, "value": round(1 - risk, 3)},
                "availability": {"weight": 0.25, "value": availability},
            },
            "last_updated": datetime.now().isoformat(),
        }


digital_twin_engine = DigitalTwinEngine()
