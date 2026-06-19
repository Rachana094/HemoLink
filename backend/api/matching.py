"""
Matching API Routes — AI-powered donor-patient matching.
"""
from fastapi import APIRouter
from backend.schemas.schemas import MatchRequest, MatchResponse
from backend.agents.semantic_matching_agent import semantic_matching_agent
from backend.agents.orchestrator import orchestrator

router = APIRouter(prefix="/api/matching", tags=["Matching"])


@router.post("/find")
async def find_matches(req: MatchRequest):
    """Find optimal donor matches using Semantic Matching Agent."""
    return semantic_matching_agent.find_matches(
        blood_type=req.blood_type, latitude=req.latitude, longitude=req.longitude,
        urgency=req.urgency, units_needed=req.units_needed,
        max_distance_km=req.max_distance_km, top_k=10)


@router.post("/emergency")
async def emergency_match(req: MatchRequest):
    """Full emergency orchestration: Match → Route → Predict → Notify."""
    return orchestrator.handle_emergency_request(
        blood_type=req.blood_type, latitude=req.latitude, longitude=req.longitude,
        urgency=req.urgency, units=req.units_needed)
