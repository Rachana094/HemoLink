"""
Blood Bank Model — Inventory and location tracking for blood banks/hospitals.
"""
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from backend.core.database import Base
import uuid


class BloodBank(Base):
    __tablename__ = "blood_banks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # ── Identity ──
    name = Column(String(150), nullable=False)
    license_number = Column(String(50), nullable=True)
    type = Column(String(30), default="hospital")  # hospital/standalone/mobile
    
    # ── Location ──
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(300), nullable=True)
    city = Column(String(50), nullable=False)
    state = Column(String(50), nullable=False)
    pincode = Column(String(10), nullable=True)
    
    # ── Inventory ──
    inventory = Column(JSON, default=lambda: {
        "A+": 0, "A-": 0, "B+": 0, "B-": 0,
        "AB+": 0, "AB-": 0, "O+": 0, "O-": 0
    })
    total_capacity = Column(Integer, default=500)
    current_stock = Column(Integer, default=0)
    
    # ── Operations ──
    operating_hours = Column(String(50), default="24/7")
    contact_phone = Column(String(20), nullable=True)
    contact_email = Column(String(150), nullable=True)
    
    # ── Analytics ──
    avg_daily_demand = Column(JSON, default=dict)
    wastage_rate = Column(Float, default=0.08)
    fulfillment_rate = Column(Float, default=0.85)
    
    # ── Metadata ──
    is_active = Column(Boolean, default=True)
    last_audit_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "city": self.city,
            "state": self.state,
            "inventory": self.inventory,
            "total_capacity": self.total_capacity,
            "current_stock": self.current_stock,
            "wastage_rate": self.wastage_rate,
            "fulfillment_rate": self.fulfillment_rate,
            "is_active": self.is_active,
        }
