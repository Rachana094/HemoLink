"""
Blood Request Model — Tracks emergency and scheduled blood requests through the system.
"""
from sqlalchemy import Column, String, Float, Integer, DateTime, JSON, Text
from sqlalchemy.sql import func
from backend.core.database import Base
import uuid


class BloodRequest(Base):
    __tablename__ = "blood_requests"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # ── Request Details ──
    patient_id = Column(String, nullable=False)
    blood_type = Column(String(5), nullable=False)
    units_needed = Column(Integer, default=1)
    urgency = Column(String(20), default="normal")  # critical/urgent/normal/scheduled
    
    # ── Medical Context ──
    reason = Column(String(200), nullable=True)
    hospital_name = Column(String(150), nullable=True)
    doctor_name = Column(String(100), nullable=True)
    
    # ── Location ──
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # ── AI Processing ──
    status = Column(String(30), default="pending")  # pending/matching/matched/fulfilled/cancelled
    matched_donors = Column(JSON, default=list)
    match_scores = Column(JSON, default=list)
    agent_decisions = Column(JSON, default=list)
    predicted_fulfillment_time = Column(Float, nullable=True)  # minutes
    
    # ── Routing ──
    optimal_route = Column(JSON, nullable=True)
    estimated_eta_minutes = Column(Float, nullable=True)
    
    # ── Timeline ──
    requested_at = Column(DateTime, server_default=func.now())
    matched_at = Column(DateTime, nullable=True)
    fulfilled_at = Column(DateTime, nullable=True)
    
    # ── Metadata ──
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "blood_type": self.blood_type,
            "units_needed": self.units_needed,
            "urgency": self.urgency,
            "hospital_name": self.hospital_name,
            "status": self.status,
            "matched_donors": self.matched_donors,
            "match_scores": self.match_scores,
            "predicted_fulfillment_time": self.predicted_fulfillment_time,
            "estimated_eta_minutes": self.estimated_eta_minutes,
            "requested_at": str(self.requested_at) if self.requested_at else None,
            "created_at": str(self.created_at) if self.created_at else None,
        }
