import json
from sqlalchemy.orm import Session
from ...Models.Medical_Data import MedicalAnalysis
from ...Schemas.Medical_Data_Schema import HealthDataRead
from .Client import call_genai
from .Prompts.Medical_Data_Prompts import Medical_Analysis_Prompts

async def Analysis_And_Save(data : HealthDataRead, db: Session) -> MedicalAnalysis:
    raw = await call_genai(Medical_Analysis_Prompts(data))

    clean = raw.replace("```json", "").replace("```", "").strip()

    try : 
        result = json.loads(clean)
    except json.JSONDecodeError:
        raise RuntimeError(f"Gemini Returned Invalid JSON: {raw}")
    
    analysis = MedicalAnalysis(
        report_id=data.id,
        cardiac_risk_score=result.get("cardiac_risk_score"),
        metabolic_status=result.get("metabolic_status"),
        kidney_status=result.get("kidney_status"),
        ai_summary=result.get("ai_summary"),
    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return analysis