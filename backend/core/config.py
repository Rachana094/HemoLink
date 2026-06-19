"""
HemoLink Configuration — Pydantic Settings for all system components.
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Central configuration for HemoLink platform."""

    # ── Application ──
    APP_NAME: str = "HemoLink"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "AI-Orchestrated Blood Supply Chain Intelligence Platform"
    DEBUG: bool = True

    # ── Server ──
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: list[str] = ["*"]

    # ── Database ──
    DATABASE_URL: str = "sqlite+aiosqlite:///./hemolink.db"

    # ── Vector Store ──
    CHROMA_PERSIST_DIR: str = "./chroma_data"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIM: int = 384

    # ── AI Agents ──
    MATCHING_THRESHOLD: float = 0.65
    PREDICTION_HORIZON_DAYS: int = 30
    CHURN_RISK_THRESHOLD: float = 0.7
    ENGAGEMENT_WINDOW_HOURS: int = 48

    # ── Geo-Spatial ──
    DEFAULT_CITY_LAT: float = 12.9716  # Bangalore
    DEFAULT_CITY_LNG: float = 77.5946
    MAX_ROUTING_DISTANCE_KM: float = 50.0
    AVERAGE_SPEED_KMH: float = 30.0

    # ── OCR Pipeline ──
    OCR_CONFIDENCE_THRESHOLD: float = 0.85
    MAX_OCR_PROCESSING_TIME_SEC: int = 30

    # ── Federated Learning ──
    FL_ROUNDS: int = 10
    FL_MIN_PARTICIPANTS: int = 3
    FL_DIFFERENTIAL_PRIVACY_EPSILON: float = 1.0

    # ── Redis (simulated) ──
    REDIS_URL: str = "redis://localhost:6379"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
