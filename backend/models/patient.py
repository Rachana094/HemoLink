"""
Patient Model — Patients who request blood.
"""
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from backend.core.database import Base
import uuid


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # ── Identity ──
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(10), nullable=False)
    contact_phone = Column(String(20), nullable=False)
    contact_email = Column(String(150), nullable=True)
    
    # ── Blood Requirement ──
    blood_type_needed = Column(String(5), nullable=False)
    units_needed = Column(Integer, default=1)
    
    # ── Medical Context ──
    diagnosis = Column(String(200), nullable=True)
    hospital_name = Column(String(150), nullable=True)
    hospital_id = Column(String, nullable=True)
    attending_doctor = Column(String(100), nullable=True)
    urgency_level = Column(String(20), default="normal")  # critical/urgent/normal/scheduled
    
    # ── Location ──
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    city = Column(String(50), nullable=True)
    state = Column(String(50), nullable=True)
    
    # ── History ──
    transfusion_history = Column(JSON, default=list)
    medical_records = Column(JSON, default=list)
    
    # ── Metadata ──
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "age": self.age,
            "gender": self.gender,
            "blood_type_needed": self.blood_type_needed,
            "units_needed": self.units_needed,
            "hospital_name": self.hospital_name,
            "urgency_level": self.urgency_level,
            "city": self.city,
            "created_at": str(self.created_at) if self.created_at else None,
        }
