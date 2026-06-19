"""
Continuity & Engagement Agent — Donor retention, churn prediction, re-engagement optimization.
"""
from typing import Dict, Any, List
from datetime import datetime, timedelta
from backend.services.prediction_engine import prediction_engine
from backend.services.digital_twin import digital_twin_engine
import numpy as np


class EngagementAgent:
    """
    Agent 3: Continuity & Engagement Agent (CEA)
    Objective: Maximize donor retention, predict churn, optimize re-engagement timing.
    """

    def analyze_donor_base(self, donors: List[Dict[str, Any]]) -> Dict[str, Any]:
        reasoning = ["💡 Engagement Agent analyzing donor base",
                     f"👥 Processing {len(donors)} donor profiles"]

        at_risk = []
        engagement_plans = []
        total_churn_risk = 0

        for donor in donors:
            twin = digital_twin_engine.generate_full_twin(donor)
            behavior = prediction_engine.predict_donor_behavior(
                donor.get("activity_timeline", []), donor.get("id", "unknown"))

            churn = behavior["churn_probability"]
            total_churn_risk += churn

            if churn > 0.5:
                strategy = self._generate_strategy(donor, twin, behavior)
                at_risk.append({
                    "donor_id": donor.get("id"), "donor_name": donor.get("name"),
                    "blood_type": donor.get("blood_type"), "churn_probability": churn,
                    "engagement_score": twin["engagement_score"],
                    "recommended_action": strategy["action"],
                    "optimal_contact": strategy["contact"],
                    "priority": "high" if churn > 0.7 else "medium",
                })
                engagement_plans.append(strategy)

        at_risk.sort(key=lambda x: x["churn_probability"], reverse=True)
        avg_churn = total_churn_risk / max(len(donors), 1)
        reasoning.append(f"⚠️ {len(at_risk)} donors at risk of churning (avg churn: {avg_churn:.2f})")
        reasoning.append(f"📋 Generated {len(engagement_plans)} personalized engagement plans")

        return {
            "total_donors_analyzed": len(donors),
            "at_risk_donors": at_risk[:20],
            "avg_churn_risk": round(avg_churn, 3),
            "engagement_plans": engagement_plans[:10],
            "retention_forecast": {
                "current_retention_rate": round(1 - avg_churn, 3),
                "projected_30d": round(min(1, (1 - avg_churn) * 1.1), 3),
                "projected_90d": round(min(1, (1 - avg_churn) * 1.05), 3),
            },
            "agent_reasoning": reasoning,
        }

    def _generate_strategy(self, donor: Dict, twin: Dict, behavior: Dict) -> Dict[str, Any]:
        churn = behavior["churn_probability"]
        donations = donor.get("total_donations", 0)
        if churn > 0.8 and donations <= 1:
            action = "Send personalized thank-you with impact story. Schedule follow-up call."
        elif churn > 0.7:
            action = "Invite to upcoming donation camp near preferred location. Offer convenience."
        elif churn > 0.5:
            action = "Share blood usage impact report. Remind of eligibility date."
        else:
            action = "Standard engagement: monthly newsletter + community updates."
        return {
            "donor_id": donor.get("id"), "action": action,
            "contact": {"method": behavior.get("best_channel", "sms"),
                        "day": behavior.get("optimal_contact_day", "Mon"),
                        "urgency": "immediate" if churn > 0.8 else "within_week"},
            "predicted_response_rate": round(max(0.1, 1 - churn * 0.8), 3),
        }


engagement_agent = EngagementAgent()
