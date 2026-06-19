"""
Donor Digital Twin Model — The core entity of HemoLink.
Each donor has a comprehensive digital twin with behavioral scores,
preference vectors, and activity timelines.
"""
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, JSON, Text
from sqlalchemy.sql import func
from backend.core.database import Base
import uuid


class Donor(Base):
    """
    Digital Twin Profile for blood donors.
    
    Scoring Dimensions:
    - reliability_score: Based on donation history consistency (0-1)
    - engagement_score: Interaction frequency and responsiveness (0-1)
    - risk_score: Health risk and eligibility concerns (0-1, lower = better)
    - availability_score: Current availability and willingness (0-1)
    """
    __tablename__ = "donors"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # ── Identity ──
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    phone = Column(String(20), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(10), nullable=False)
    
    # ── Blood Profile ──
    blood_type = Column(String(5), nullable=False)  # A+, A-, B+, B-, AB+, AB-, O+, O-
    rh_factor = Column(String(1), nullable=False)    # + or -
    
    # ── Location ──
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    city = Column(String(50), nullable=False)
    district = Column(String(50), nullable=True)
    state = Column(String(50), nullable=False)
    pincode = Column(String(10), nullable=True)
    
    # ── Digital Twin Scores ──
    reliability_score = Column(Float, default=0.5)
    engagement_score = Column(Float, default=0.5)
    risk_score = Column(Float, default=0.2)
    availability_score = Column(Float, default=0.8)
    
    # ── Behavioral Data ──
    total_donations = Column(Integer, default=0)
    last_donation_date = Column(DateTime, nullable=True)
    avg_donation_interval_days = Column(Float, nullable=True)
    no_show_count = Column(Integer, default=0)
    response_rate = Column(Float, default=1.0)
    
    # ── Preference Vector ──
    preferred_donation_time = Column(String(20), default="morning")  # morning/afternoon/evening
    preferred_location_type = Column(String(30), default="hospital") # hospital/camp/mobile
    preferred_contact_method = Column(String(20), default="sms")     # sms/call/whatsapp/email
    max_travel_distance_km = Column(Float, default=10.0)
    
    # ── Health & Eligibility ──
    weight_kg = Column(Float, nullable=True)
    hemoglobin_level = Column(Float, nullable=True)
    is_eligible = Column(Boolean, default=True)
    medical_conditions = Column(JSON, default=list)
    medications = Column(JSON, default=list)
    
    # ── Engagement History ──
    activity_timeline = Column(JSON, default=list)  # List of {event, timestamp, details}
    churn_risk = Column(Float, default=0.1)
    next_eligible_date = Column(DateTime, nullable=True)
    
    # ── Embedding ──
    embedding_vector = Column(JSON, nullable=True)  # Stored as list of floats
    
    # ── Metadata ──
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "age": self.age,
            "gender": self.gender,
            "blood_type": self.blood_type,
            "rh_factor": self.rh_factor,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "city": self.city,
            "state": self.state,
            "reliability_score": self.reliability_score,
            "engagement_score": self.engagement_score,
            "risk_score": self.risk_score,
            "availability_score": self.availability_score,
            "total_donations": self.total_donations,
            "last_donation_date": str(self.last_donation_date) if self.last_donation_date else None,
            "churn_risk": self.churn_risk,
            "is_eligible": self.is_eligible,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "created_at": str(self.created_at) if self.created_at else None,
        }
