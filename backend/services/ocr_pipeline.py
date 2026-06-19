"""
HemoLink OCR Pipeline — Document digitization simulation.
Physical Input → OCR → NLP Cleaning → Entity Extraction → Validation → Vector Indexing → Profile Update
"""
from typing import Dict, Any
from datetime import datetime
import numpy as np
import re


class OCRPipeline:
    """Simulates Tesseract + Vision AI + NER for medical document processing."""

    SAMPLE_DOCUMENTS = {
        "blood_report": {
            "raw_text": "COMPLETE BLOOD COUNT REPORT\nPatient: Rajesh Kumar\nAge: 34 Gender: Male\nDate: 15-05-2026\nHemoglobin: 14.2 g/dL\nRBC Count: 5.1 million/mcL\nWBC Count: 7,200 /mcL\nPlatelet Count: 250,000 /mcL\nBlood Group: B+\nRh Factor: Positive",
            "document_type": "blood_report",
        },
        "donor_card": {
            "raw_text": "BLOOD DONOR CARD\nName: Ananya Sharma\nDonor ID: BD-2026-4521\nBlood Group: O+\nLast Donation: 12-03-2026\nTotal Donations: 8\nStatus: Active\nPreferred Center: Bangalore Medical College",
            "document_type": "donor_card",
        },
        "prescription": {
            "raw_text": "PRESCRIPTION\nDr. Priya Nair, MS General Surgery\nHospital: Victoria Hospital, Bangalore\nPatient: Meera Devi, Age 45\nDiagnosis: Scheduled Surgery - Hysterectomy\nBlood Requirement: 2 units Packed RBCs, Type A+\nUrgency: Scheduled (48 hours)\nCross-match required",
            "document_type": "prescription",
        },
    }

    def process_document(self, document_type: str = "blood_report", raw_text: str = None) -> Dict[str, Any]:
        """Full OCR pipeline: OCR → NLP → NER → Validate → Index."""
        start = datetime.now()
        sample = self.SAMPLE_DOCUMENTS.get(document_type, self.SAMPLE_DOCUMENTS["blood_report"])
        text = raw_text or sample["raw_text"]
        # Stage 1: OCR (simulated — text already extracted)
        cleaned = self._nlp_clean(text)
        # Stage 2: NER
        entities = self._extract_entities(cleaned, document_type)
        # Stage 3: Validate
        validation = self._validate_entities(entities)
        # Stage 4: Profile updates
        profile_updates = self._generate_profile_updates(entities, document_type)
        elapsed = (datetime.now() - start).total_seconds() * 1000 + np.random.uniform(50, 200)
        return {
            "document_type": document_type, "raw_text": text, "cleaned_text": cleaned,
            "extracted_entities": entities, "confidence_score": round(np.random.uniform(0.88, 0.97), 3),
            "processing_time_ms": round(elapsed, 1),
            "validation_status": "passed" if validation["is_valid"] else "needs_review",
            "validation_details": validation, "profile_updates": profile_updates,
            "pipeline_stages": [
                {"stage": "OCR", "status": "complete", "engine": "Tesseract + Vision AI"},
                {"stage": "NLP Cleaning", "status": "complete", "method": "regex + tokenization"},
                {"stage": "Entity Extraction", "status": "complete", "model": "BiLSTM-CRF NER"},
                {"stage": "Validation", "status": "complete", "rules": len(validation.get("checks", []))},
                {"stage": "Vector Indexing", "status": "complete", "store": "ChromaDB"},
            ],
        }

    def _nlp_clean(self, text: str) -> str:
        text = re.sub(r'\s+', ' ', text).strip()
        text = re.sub(r'[^\w\s:.,/\-+()]', '', text)
        return text

    def _extract_entities(self, text: str, doc_type: str) -> Dict[str, Any]:
        entities = {}
        name_match = re.search(r'(?:Patient|Name|Donor)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)', text)
        if name_match:
            entities["name"] = name_match.group(1)
        age_match = re.search(r'Age[:\s]+(\d+)', text)
        if age_match:
            entities["age"] = int(age_match.group(1))
        bg_match = re.search(r'(?:Blood Group|Blood Type|Type)[:\s]+((?:A|B|AB|O)[+-]?)', text)
        if bg_match:
            entities["blood_group"] = bg_match.group(1)
        hb_match = re.search(r'Hemoglobin[:\s]+([\d.]+)', text)
        if hb_match:
            entities["hemoglobin"] = float(hb_match.group(1))
        gender_match = re.search(r'Gender[:\s]+(Male|Female)', text)
        if gender_match:
            entities["gender"] = gender_match.group(1)
        units_match = re.search(r'(\d+)\s*units?', text)
        if units_match:
            entities["units_needed"] = int(units_match.group(1))
        if "Positive" in text:
            entities["rh_factor"] = "+"
        elif "Negative" in text:
            entities["rh_factor"] = "-"
        return entities

    def _validate_entities(self, entities: Dict) -> Dict[str, Any]:
        checks = []
        valid = True
        if "blood_group" in entities:
            bg = entities["blood_group"]
            checks.append({"field": "blood_group", "valid": bg in ["A+","A-","B+","B-","AB+","AB-","O+","O-"], "value": bg})
        if "hemoglobin" in entities:
            hb = entities["hemoglobin"]
            ok = 7.0 <= hb <= 20.0
            checks.append({"field": "hemoglobin", "valid": ok, "value": hb})
            if not ok:
                valid = False
        if "age" in entities:
            age = entities["age"]
            ok = 1 <= age <= 120
            checks.append({"field": "age", "valid": ok, "value": age})
            if not ok:
                valid = False
        return {"is_valid": valid, "checks": checks, "entity_count": len(entities)}

    def _generate_profile_updates(self, entities: Dict, doc_type: str) -> Dict[str, Any]:
        updates = {}
        if "hemoglobin" in entities:
            updates["hemoglobin_level"] = entities["hemoglobin"]
        if "blood_group" in entities:
            updates["blood_type"] = entities["blood_group"]
        if "age" in entities:
            updates["age"] = entities["age"]
        return {"fields_to_update": updates, "source_document": doc_type, "auto_apply": len(updates) > 0}


ocr_pipeline = OCRPipeline()
