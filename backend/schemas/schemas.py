"""
HemoLink API Schemas — Pydantic models for all request/response payloads.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ═══════════════════════════════════════════════════
#  DONOR SCHEMAS
# ═══════════════════════════════════════════════════

class DonorCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str
    phone: str
    age: int = Field(..., ge=18, le=65)
    gender: str
    blood_type: str
    rh_factor: str = "+"
    latitude: float
    longitude: float
    city: str
    state: str
    weight_kg: Optional[float] = None
    hemoglobin_level: Optional[float] = None
    preferred_donation_time: str = "morning"
    preferred_contact_method: str = "sms"
    max_travel_distance_km: float = 10.0


class DonorResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    age: int
    gender: str
    blood_type: str
    rh_factor: str
    latitude: float
    longitude: float
    city: str
    state: str
    reliability_score: float
    engagement_score: float
    risk_score: float
    availability_score: float
    total_donations: int
    last_donation_date: Optional[str] = None
    churn_risk: float
    is_eligible: bool
    is_active: bool
    is_verified: bool
    created_at: Optional[str] = None


class DonorDigitalTwin(BaseModel):
    """Complete Digital Twin profile with all scoring dimensions."""
    id: str
    name: str
    blood_type: str
    reliability_score: float
    engagement_score: float
    risk_score: float
    availability_score: float
    total_donations: int
    avg_donation_interval_days: Optional[float]
    no_show_count: int
    response_rate: float
    churn_risk: float
    preferred_donation_time: str
    preferred_contact_method: str
    activity_timeline: List[Dict[str, Any]]
    composite_score: Optional[float] = None


# ═══════════════════════════════════════════════════
#  BLOOD REQUEST SCHEMAS
# ═══════════════════════════════════════════════════

class BloodRequestCreate(BaseModel):
    patient_id: str
    blood_type: str
    units_needed: int = Field(default=1, ge=1, le=20)
    urgency: str = "normal"  # critical/urgent/normal/scheduled
    reason: Optional[str] = None
    hospital_name: Optional[str] = None
    doctor_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class BloodRequestResponse(BaseModel):
    id: str
    patient_id: str
    blood_type: str
    units_needed: int
    urgency: str
    hospital_name: Optional[str]
    status: str
    matched_donors: List[Dict[str, Any]]
    match_scores: List[float]
    predicted_fulfillment_time: Optional[float]
    estimated_eta_minutes: Optional[float]
    requested_at: Optional[str]


# ═══════════════════════════════════════════════════
#  MATCHING SCHEMAS
# ═══════════════════════════════════════════════════

class MatchRequest(BaseModel):
    blood_type: str
    urgency: str = "normal"
    latitude: float
    longitude: float
    units_needed: int = 1
    max_distance_km: float = 50.0
    medical_context: Optional[str] = None


class MatchResult(BaseModel):
    donor_id: str
    donor_name: str
    blood_type: str
    match_score: float
    compatibility_score: float
    proximity_score: float
    reliability_score: float
    availability_score: float
    distance_km: float
    estimated_eta_minutes: float
    donor_location: Dict[str, float]


class MatchResponse(BaseModel):
    request_id: str
    blood_type: str
    urgency: str
    total_candidates: int
    matches: List[MatchResult]
    agent_reasoning: List[str]
    processing_time_ms: float


# ═══════════════════════════════════════════════════
#  PREDICTION SCHEMAS
# ═══════════════════════════════════════════════════

class DemandForecast(BaseModel):
    blood_type: str
    date: str
    predicted_demand: float
    confidence_lower: float
    confidence_upper: float
    model_used: str


class ShortageAlert(BaseModel):
    blood_type: str
    blood_bank_id: str
    blood_bank_name: str
    current_stock: int
    predicted_demand_7d: float
    risk_level: str  # critical/high/medium/low
    recommended_action: str
    lead_time_hours: float


class PredictionResponse(BaseModel):
    forecasts: List[DemandForecast]
    shortage_alerts: List[ShortageAlert]
    risk_scores: Dict[str, float]
    models_used: List[str]
    prediction_horizon_days: int


# ═══════════════════════════════════════════════════
#  GEO-SPATIAL SCHEMAS
# ═══════════════════════════════════════════════════

class RouteRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    destination_lat: float
    destination_lng: float
    waypoints: Optional[List[Dict[str, float]]] = None


class RouteResponse(BaseModel):
    distance_km: float
    estimated_time_minutes: float
    path: List[Dict[str, float]]
    algorithm_used: str
    optimization_notes: List[str]


# ═══════════════════════════════════════════════════
#  ANALYTICS SCHEMAS
# ═══════════════════════════════════════════════════

class DashboardMetrics(BaseModel):
    total_donors: int
    active_donors: int
    total_requests: int
    pending_requests: int
    fulfilled_requests: int
    avg_match_time_minutes: float
    avg_fulfillment_time_minutes: float
    total_donations_today: int
    blood_inventory: Dict[str, int]
    shortage_alerts: int
    donor_churn_rate: float
    system_health: float


class AgentStatus(BaseModel):
    agent_name: str
    status: str  # active/idle/error
    tasks_completed: int
    avg_response_time_ms: float
    accuracy: float
    last_active: str


class SystemAnalytics(BaseModel):
    dashboard_metrics: DashboardMetrics
    agent_statuses: List[AgentStatus]
    recent_matches: List[Dict[str, Any]]
    demand_trend: List[Dict[str, Any]]
    regional_heatmap: List[Dict[str, Any]]


# ═══════════════════════════════════════════════════
#  OCR SCHEMAS
# ═══════════════════════════════════════════════════

class OCRResult(BaseModel):
    document_type: str
    extracted_entities: Dict[str, Any]
    confidence_score: float
    processing_time_ms: float
    raw_text: str
    validation_status: str
    profile_updates: Dict[str, Any]


# ═══════════════════════════════════════════════════
#  RAG SCHEMAS
# ═══════════════════════════════════════════════════

class RAGQuery(BaseModel):
    query: str
    context_type: str = "general"  # general/medical/policy/donor
    max_results: int = 5


class RAGResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    confidence: float
    retrieval_scores: List[float]
    context_used: List[str]
