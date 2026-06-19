"""
Predictive Intelligence Agent — Demand forecasting, shortage prediction, risk scoring.
"""
from typing import Dict, Any
from backend.services.prediction_engine import prediction_engine


class PredictiveAgent:
    """
    Agent 2: Predictive Intelligence Agent (PIA)
    Objective: Forecast blood demand, predict shortages, generate risk scores.
    Models: LSTM, XGBoost, Random Forest, Transformer
    """

    def analyze(self, inventory: Dict[str, int] = None, region: str = "bangalore",
                horizon_days: int = 30) -> Dict[str, Any]:
        if inventory is None:
            inventory = {"A+": 45, "A-": 8, "B+": 52, "B-": 5, "AB+": 12, "AB-": 2, "O+": 65, "O-": 7}

        reasoning = ["🧠 Predictive Intelligence Agent activated",
                     f"📊 Analyzing inventory across {len(inventory)} blood types",
                     f"🔮 Forecasting {horizon_days}-day demand horizon"]

        # Demand forecasts
        all_forecasts = {}
        for bt in prediction_engine.BLOOD_TYPES:
            all_forecasts[bt] = prediction_engine.forecast_demand(bt, horizon_days, region)

        # Shortage alerts
        alerts = prediction_engine.predict_shortages(inventory)
        critical = [a for a in alerts if a["risk_level"] == "critical"]
        high = [a for a in alerts if a["risk_level"] == "high"]

        reasoning.append(f"⚠️ {len(critical)} critical, {len(high)} high-risk alerts detected")

        # Risk scores
        risk_scores = prediction_engine.calculate_risk_scores(region)

        # Model performance
        performance = prediction_engine.get_model_performance()

        return {
            "forecasts": all_forecasts,
            "shortage_alerts": alerts,
            "risk_scores": risk_scores,
            "models_used": ["LSTM-v2", "XGBoost-v3", "RandomForest-v2", "Transformer-v2"],
            "prediction_horizon_days": horizon_days,
            "model_performance": performance,
            "agent_reasoning": reasoning,
            "inventory_analyzed": inventory,
            "region": region,
        }


predictive_agent = PredictiveAgent()
