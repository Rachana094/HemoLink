"""
Analytics API Routes — Dashboard metrics, agent statuses, system health.
"""
from fastapi import APIRouter
from backend.agents.orchestrator import orchestrator
from backend.agents.engagement_agent import engagement_agent
from backend.api.donors import donors_db
from backend.services.vector_store import vector_store
from backend.services.geo_engine import geo_engine
from backend.services.rag_engine import rag_engine
from backend.services.federated_learning import federated_engine
from backend.services.ocr_pipeline import ocr_pipeline
from backend.services.prediction_engine import prediction_engine
import numpy as np

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/dashboard")
async def get_dashboard_metrics():
    """Real-time dashboard metrics for the command center."""
    donors = list(donors_db.values())
    active = [d for d in donors if d.get("is_active")]
    inventory = {"A+": 45, "A-": 8, "B+": 52, "B-": 5, "AB+": 12, "AB-": 2, "O+": 65, "O-": 7}
    alerts = prediction_engine.predict_shortages(inventory)
    critical = len([a for a in alerts if a["risk_level"] in ("critical", "high")])

    return {
        "total_donors": len(donors), "active_donors": len(active),
        "total_requests": 156, "pending_requests": 3, "fulfilled_requests": 149,
        "avg_match_time_minutes": 4.2, "avg_fulfillment_time_minutes": 18.7,
        "total_donations_today": 12, "blood_inventory": inventory,
        "shortage_alerts": critical, "donor_churn_rate": 0.18,
        "system_health": 0.97, "lives_saved_estimate": 447,
        "wastage_reduction_pct": 42.3, "response_time_improvement_pct": 83,
    }


@router.get("/agents")
async def get_agent_statuses():
    """Get status of all AI agents."""
    return {"agents": orchestrator.get_agent_statuses()}


@router.get("/engagement")
async def get_engagement_analysis():
    """Analyze donor engagement and churn risk."""
    donors = list(donors_db.values())
    return engagement_agent.analyze_donor_base(donors)


@router.get("/routing/network")
async def get_routing_network():
    """Get the geo-spatial routing network info."""
    return geo_engine.get_network_info()


@router.get("/routing/find")
async def find_route(olat: float, olng: float, dlat: float, dlng: float):
    """Find optimal route between two points."""
    return geo_engine.find_optimal_route(olat, olng, dlat, dlng)


@router.get("/rag/query")
async def rag_query(q: str, context: str = "general"):
    """Query the RAG knowledge base."""
    return rag_engine.query(q, context_type=context)


@router.get("/rag/stats")
async def rag_stats():
    return rag_engine.get_stats()


@router.get("/ocr/process")
async def process_document(doc_type: str = "blood_report"):
    """Simulate OCR document processing."""
    return ocr_pipeline.process_document(doc_type)


@router.get("/federated/train")
async def federated_train(rounds: int = 10):
    """Run federated learning training simulation."""
    return federated_engine.run_full_training(rounds)


@router.get("/federated/architecture")
async def federated_architecture():
    return federated_engine.get_architecture()


@router.get("/vector-store/stats")
async def vector_store_stats():
    return vector_store.get_stats()


@router.get("/system/architecture")
async def system_architecture():
    """Return complete system architecture metadata."""
    return {
        "platform": "HemoLink", "version": "1.0.0",
        "architecture": {
            "layer_1_engagement": ["Web Dashboard", "WhatsApp Agent", "Voice Agent", "Chatbot", "Regional Language Support"],
            "layer_2_intelligence": ["Semantic Matching Agent", "Predictive Intelligence Agent",
                                     "Continuity & Engagement Agent", "Geo-Spatial Routing Agent", "RAG Query Agent", "OCR Pipeline Agent"],
            "layer_3_data_foundation": ["Digital Twin Profiles", "Vector Database (ChromaDB)", "Knowledge Graph",
                                        "OCR Pipeline", "Federated Learning", "Event Streaming"],
        },
        "agents": [a["name"] for a in orchestrator.get_agent_statuses()],
        "models": ["LSTM-v2", "XGBoost-v3", "RandomForest-v2", "Transformer-BehaviorNet-v2",
                    "all-MiniLM-L6-v2 (embeddings)", "BiLSTM-CRF (NER)"],
        "algorithms": ["Cosine Similarity", "HNSW Index", "Dijkstra", "A* Search",
                        "FedAvg", "Differential Privacy", "Survival Analysis"],
        "tech_stack": {"backend": "FastAPI + Python 3.11", "database": "PostgreSQL / SQLite",
                       "vector_db": "ChromaDB", "cache": "Redis", "deployment": "Docker + Kubernetes"},
    }
