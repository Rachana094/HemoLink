"""
Predictions API Routes — Demand forecasting, shortage alerts, risk scores.
"""
from fastapi import APIRouter
from typing import Optional
from backend.agents.predictive_agent import predictive_agent
from backend.services.prediction_engine import prediction_engine

router = APIRouter(prefix="/api/predictions", tags=["Predictions"])


@router.get("/forecast/{blood_type}")
async def get_forecast(blood_type: str, days: int = 30, region: str = "bangalore"):
    """Get demand forecast for a specific blood type."""
    return {"blood_type": blood_type, "horizon_days": days,
            "forecasts": prediction_engine.forecast_demand(blood_type, days, region)}


@router.get("/shortages")
async def get_shortage_alerts(region: str = "bangalore"):
    """Get shortage predictions across all blood types."""
    inventory = {"A+": 45, "A-": 8, "B+": 52, "B-": 5, "AB+": 12, "AB-": 2, "O+": 65, "O-": 7}
    return {"alerts": prediction_engine.predict_shortages(inventory), "inventory": inventory}


@router.get("/risk-scores")
async def get_risk_scores(region: str = "bangalore"):
    """Get risk scores per blood type for a region."""
    return {"region": region, "scores": prediction_engine.calculate_risk_scores(region)}


@router.get("/full-analysis")
async def full_predictive_analysis(region: str = "bangalore", days: int = 30):
    """Complete predictive analysis from all models."""
    return predictive_agent.analyze(region=region, horizon_days=days)


@router.get("/model-performance")
async def model_performance():
    """Get performance metrics for all prediction models."""
    return prediction_engine.get_model_performance()
