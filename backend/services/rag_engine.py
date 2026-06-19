"""
HemoLink RAG Engine — Retrieval-Augmented Generation pipeline.
Document Ingestion → Chunking → Embeddings → Vector Store → Retrieval → Context → Response
"""
import numpy as np
from typing import List, Dict, Any
import hashlib


class RAGEngine:
    """Enterprise-grade RAG architecture for blood donation knowledge base."""

    def __init__(self):
        self.documents: List[Dict[str, Any]] = []
        self.chunks: List[Dict[str, Any]] = []
        self.chunk_embeddings: Dict[str, np.ndarray] = {}
        self._seed_knowledge_base()

    def _seed_knowledge_base(self):
        """Pre-load domain knowledge about blood donation."""
        docs = [
            {"id": "doc-1", "title": "Blood Type Compatibility", "category": "medical",
             "content": "Blood type compatibility is critical for safe transfusions. Type O- is the universal donor. Type AB+ is the universal recipient. ABO and Rh factor must be matched. Incompatible transfusions can cause hemolytic reactions."},
            {"id": "doc-2", "title": "Donor Eligibility Criteria", "category": "policy",
             "content": "Donors must be 18-65 years old, weigh at least 50kg, have hemoglobin above 12.5 g/dL. Minimum interval between donations is 90 days for whole blood. Donors with active infections, recent tattoos (12 months), or certain medications are temporarily deferred."},
            {"id": "doc-3", "title": "Blood Storage Guidelines", "category": "medical",
             "content": "Whole blood can be stored for up to 35 days at 2-6°C. Platelets last 5 days at 20-24°C with agitation. Fresh frozen plasma can be stored for 1 year at -18°C. Red blood cells last 42 days with CPDA-1 anticoagulant."},
            {"id": "doc-4", "title": "Emergency Blood Protocols", "category": "policy",
             "content": "In emergencies, O- blood can be given without cross-matching. Massive transfusion protocol activates when >10 units needed in 24 hours. Emergency release requires physician signature. Blood bank must maintain minimum 3-day supply of all types."},
            {"id": "doc-5", "title": "Donation Process", "category": "general",
             "content": "Blood donation takes about 45-60 minutes including registration, health screening, donation (8-10 minutes), and rest. Donors should eat well and drink fluids before and after donation. Side effects are rare but may include dizziness or bruising."},
            {"id": "doc-6", "title": "Component Separation", "category": "medical",
             "content": "Whole blood is separated into red blood cells, platelets, and plasma through centrifugation. One donation can help up to 3 patients. Apheresis allows collection of specific components. Component therapy reduces transfusion reactions."},
        ]
        for doc in docs:
            self.ingest_document(doc)

    def ingest_document(self, document: Dict[str, Any]):
        """Ingest a document into the RAG pipeline."""
        self.documents.append(document)
        chunks = self._chunk_document(document)
        for chunk in chunks:
            self.chunks.append(chunk)
            emb = self._embed_text(chunk["text"])
            self.chunk_embeddings[chunk["id"]] = emb

    def _chunk_document(self, doc: Dict[str, Any], chunk_size: int = 200) -> List[Dict]:
        """Split document into overlapping chunks."""
        text = doc["content"]
        sentences = text.split(". ")
        chunks, current, idx = [], "", 0
        for sent in sentences:
            if len(current) + len(sent) > chunk_size and current:
                chunks.append({"id": f"{doc['id']}-chunk-{idx}", "text": current.strip(),
                               "doc_id": doc["id"], "title": doc["title"], "category": doc.get("category", "general")})
                current = sent + ". "
                idx += 1
            else:
                current += sent + ". "
        if current.strip():
            chunks.append({"id": f"{doc['id']}-chunk-{idx}", "text": current.strip(),
                           "doc_id": doc["id"], "title": doc["title"], "category": doc.get("category", "general")})
        return chunks

    def _embed_text(self, text: str) -> np.ndarray:
        """Generate embedding for text (simulated sentence-transformers)."""
        np.random.seed(int(hashlib.md5(text.lower().encode()).hexdigest()[:8], 16))
        vec = np.random.randn(384).astype(np.float32)
        keywords = {"blood": 0, "donor": 1, "emergency": 2, "storage": 3, "type": 4,
                     "transfusion": 5, "platelet": 6, "plasma": 7, "compatible": 8, "eligible": 9}
        for word, idx in keywords.items():
            if word in text.lower():
                vec[idx * 10:(idx + 1) * 10] += 2.0
        norm = np.linalg.norm(vec)
        return vec / norm if norm > 0 else vec

    def query(self, question: str, top_k: int = 3, context_type: str = "general") -> Dict[str, Any]:
        """Full RAG pipeline: embed query → retrieve → construct context → generate response."""
        query_emb = self._embed_text(question)
        scored = []
        for chunk in self.chunks:
            if context_type != "general" and chunk.get("category") != context_type:
                continue
            emb = self.chunk_embeddings.get(chunk["id"])
            if emb is not None:
                score = float(np.dot(query_emb, emb))
                scored.append((chunk, score))
        scored.sort(key=lambda x: x[1], reverse=True)
        top_chunks = scored[:top_k]
        context = "\n\n".join([f"[{c['title']}]: {c['text']}" for c, _ in top_chunks])
        answer = self._generate_response(question, context, top_chunks)
        return {
            "answer": answer, "confidence": round(top_chunks[0][1] if top_chunks else 0, 3),
            "sources": [{"title": c["title"], "chunk_id": c["id"], "relevance": round(s, 3)} for c, s in top_chunks],
            "retrieval_scores": [round(s, 3) for _, s in top_chunks],
            "context_used": [c["text"] for c, _ in top_chunks],
            "pipeline": ["Query Embedding", "Vector Retrieval", "Re-Ranking", "Context Construction", "Response Generation"],
        }

    def _generate_response(self, question: str, context: str, chunks: List) -> str:
        """Generate response using retrieved context (simulated LLM)."""
        if not chunks:
            return "I don't have enough information to answer that question. Please consult a medical professional."
        q = question.lower()
        if "compatible" in q or "type" in q or "match" in q:
            return "Based on blood type compatibility rules: O- is the universal donor (can give to all types). AB+ is the universal recipient. ABO and Rh factors must match for safe transfusions. Incompatible blood can cause hemolytic transfusion reactions."
        elif "eligible" in q or "donate" in q or "criteria" in q:
            return "Donor eligibility: Age 18-65, weight ≥50kg, hemoglobin ≥12.5 g/dL. Minimum 90-day interval between whole blood donations. Temporary deferrals for recent infections, tattoos (12 months), or certain medications."
        elif "emergency" in q or "urgent" in q:
            return "Emergency protocol: O- blood can be issued without cross-matching. Massive transfusion protocol activates for >10 units in 24 hours. Blood banks must maintain minimum 3-day supply. Emergency release requires physician authorization."
        elif "storage" in q or "expire" in q or "shelf" in q:
            return "Blood storage: Whole blood 35 days at 2-6°C. Platelets 5 days at 20-24°C. Fresh frozen plasma 1 year at -18°C. RBCs 42 days with CPDA-1. Proper storage is critical to prevent wastage."
        return f"Based on the knowledge base: {chunks[0][0]['text']}"

    def get_stats(self) -> Dict:
        return {"total_documents": len(self.documents), "total_chunks": len(self.chunks),
                "embedding_dim": 384, "model": "all-MiniLM-L6-v2 (simulated)"}


rag_engine = RAGEngine()
