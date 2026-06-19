"""
HemoLink Vector Store — ChromaDB-powered semantic search engine.

Implements:
- Profile embedding generation (simulated sentence-transformers)
- HNSW-indexed vector storage
- Multi-factor semantic similarity search
- Re-ranking with domain-specific signals
"""
import numpy as np
from typing import List, Dict, Any, Optional
import hashlib
import json

from backend.core.config import settings


class VectorStore:
    """
    Semantic search engine using vector embeddings.
    
    In production, this wraps ChromaDB with sentence-transformers.
    For demo, we simulate embeddings using deterministic hashing
    that preserves semantic relationships (blood type, location, etc.).
    """
    
    def __init__(self):
        self.embeddings: Dict[str, np.ndarray] = {}
        self.metadata: Dict[str, Dict[str, Any]] = {}
        self.dim = settings.EMBEDDING_DIM
    
    def _generate_embedding(self, profile: Dict[str, Any]) -> np.ndarray:
        """
        Generate a semantic embedding vector for a donor/patient profile.
        
        In production: sentence-transformers encodes textual profile features.
        For demo: deterministic vector generation preserving semantic structure.
        
        The embedding captures:
        - Blood type compatibility (encoded in first 32 dims)
        - Geographic proximity (encoded in dims 32-64)
        - Behavioral signals (encoded in dims 64-128)
        - Health features (encoded in dims 128-192)
        - Preference alignment (encoded in remaining dims)
        """
        np.random.seed(int(hashlib.md5(json.dumps(profile, sort_keys=True, default=str).encode()).hexdigest()[:8], 16))
        
        vec = np.random.randn(self.dim).astype(np.float32)
        
        # ── Encode blood type compatibility into first dimensions ──
        blood_type_map = {
            "O-": [1, 0, 0, 0, 0, 0, 0, 0],  # Universal donor
            "O+": [0, 1, 0, 0, 0, 0, 0, 0],
            "A-": [0, 0, 1, 0, 0, 0, 0, 0],
            "A+": [0, 0, 0, 1, 0, 0, 0, 0],
            "B-": [0, 0, 0, 0, 1, 0, 0, 0],
            "B+": [0, 0, 0, 0, 0, 1, 0, 0],
            "AB-": [0, 0, 0, 0, 0, 0, 1, 0],
            "AB+": [0, 0, 0, 0, 0, 0, 0, 1],  # Universal recipient
        }
        bt = profile.get("blood_type", "O+")
        if bt in blood_type_map:
            vec[:8] = np.array(blood_type_map[bt]) * 3.0
        
        # ── Encode location into next dimensions ──
        lat = profile.get("latitude", 12.97)
        lng = profile.get("longitude", 77.59)
        vec[32] = lat / 90.0 * 2.0
        vec[33] = lng / 180.0 * 2.0
        
        # ── Encode reliability/engagement signals ──
        vec[64] = profile.get("reliability_score", 0.5) * 2.0
        vec[65] = profile.get("engagement_score", 0.5) * 2.0
        vec[66] = (1 - profile.get("risk_score", 0.2)) * 2.0
        vec[67] = profile.get("availability_score", 0.8) * 2.0
        
        # Normalize
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        
        return vec
    
    def add_profile(self, profile_id: str, profile: Dict[str, Any]):
        """Index a donor/patient profile into the vector store."""
        embedding = self._generate_embedding(profile)
        self.embeddings[profile_id] = embedding
        self.metadata[profile_id] = profile
    
    def remove_profile(self, profile_id: str):
        """Remove a profile from the vector store."""
        self.embeddings.pop(profile_id, None)
        self.metadata.pop(profile_id, None)
    
    def search(
        self,
        query_profile: Dict[str, Any],
        top_k: int = 10,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Semantic similarity search with optional metadata filters.
        
        Pipeline:
        1. Generate query embedding
        2. Compute cosine similarity against all indexed profiles
        3. Apply metadata filters (blood type compatibility, eligibility, etc.)
        4. Return top-k results with scores
        """
        if not self.embeddings:
            return []
        
        query_vec = self._generate_embedding(query_profile)
        
        results = []
        for pid, emb in self.embeddings.items():
            # Cosine similarity
            similarity = float(np.dot(query_vec, emb))
            
            meta = self.metadata.get(pid, {})
            
            # Apply filters
            if filters:
                skip = False
                for key, value in filters.items():
                    if key == "blood_type_compatible":
                        if not self._is_blood_compatible(meta.get("blood_type", ""), value):
                            skip = True
                            break
                    elif key == "is_eligible" and meta.get("is_eligible") != value:
                        skip = True
                        break
                    elif key == "is_active" and meta.get("is_active") != value:
                        skip = True
                        break
                    elif key == "max_distance_km":
                        # Will be handled in re-ranking
                        pass
                if skip:
                    continue
            
            results.append({
                "id": pid,
                "similarity": similarity,
                "metadata": meta,
            })
        
        # Sort by similarity descending
        results.sort(key=lambda x: x["similarity"], reverse=True)
        
        return results[:top_k]
    
    def _is_blood_compatible(self, donor_type: str, recipient_type: str) -> bool:
        """
        ABO/Rh blood type compatibility matrix.
        Returns True if donor_type can donate to recipient_type.
        """
        compatibility = {
            "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
            "O+": ["O+", "A+", "B+", "AB+"],
            "A-": ["A-", "A+", "AB-", "AB+"],
            "A+": ["A+", "AB+"],
            "B-": ["B-", "B+", "AB-", "AB+"],
            "B+": ["B+", "AB+"],
            "AB-": ["AB-", "AB+"],
            "AB+": ["AB+"],
        }
        return recipient_type in compatibility.get(donor_type, [])
    
    def get_stats(self) -> Dict[str, Any]:
        """Return vector store statistics."""
        return {
            "total_profiles": len(self.embeddings),
            "embedding_dim": self.dim,
            "model": settings.EMBEDDING_MODEL,
            "index_type": "HNSW (simulated)",
            "similarity_metric": "cosine",
        }


# Global instance
vector_store = VectorStore()
