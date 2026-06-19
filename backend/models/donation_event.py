"""
Donation Event Model — Historical record of every donation.
"""
from sqlalchemy import Column, String, Float, Integer, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from backend.core.database import Base
import uuid


class DonationEvent(Base):
    __tablename__ = "donation_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # ── References ──
    donor_id = Column(String, nullable=False)
    blood_bank_id = Column(String, nullable=True)
    request_id = Column(String, nullable=True)
    
    # ── Donation Details ──
    blood_type = Column(String(5), nullable=False)
    units_donated = Column(Integer, default=1)
    donation_type = Column(String(20), default="whole_blood")  # whole_blood/platelets/plasma/rbc
    
    # ── Health Snapshot ──
    hemoglobin_pre = Column(Float, nullable=True)
    blood_pressure = Column(String(20), nullable=True)
    weight_kg = Column(Float, nullable=True)
    
    # ── Quality ──
    passed_screening = Column(Boolean, default=True)
    quality_grade = Column(String(5), default="A")  # A/B/C
    
    # ── Logistics ──
    donation_location = Column(String(200), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # ── Timeline ──
    scheduled_at = Column(DateTime, nullable=True)
    donated_at = Column(DateTime, server_default=func.now())
    was_no_show = Column(Boolean, default=False)
    
    # ── Metadata ──
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "donor_id": self.donor_id,
            "blood_type": self.blood_type,
            "units_donated": self.units_donated,
            "donation_type": self.donation_type,
            "quality_grade": self.quality_grade,
            "was_no_show": self.was_no_show,
            "donated_at": str(self.donated_at) if self.donated_at else None,
        }
