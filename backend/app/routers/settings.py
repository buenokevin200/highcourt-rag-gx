from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.schemas import SettingsUpdate, SettingsResponse, TestConnectionRequest, TestConnectionResponse
from app.services.settings_service import get_all_settings, update_settings
from app.services.llm_service import test_connection

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    settings = get_all_settings(db)
    return SettingsResponse(
        api_endpoint=settings.get("api_endpoint", ""),
        llm_model=settings.get("llm_model", ""),
        embedding_model=settings.get("embedding_model", ""),
        temperature=float(settings.get("temperature", 0.1)),
        top_k=int(settings.get("top_k", 5)),
        chunk_size=int(settings.get("chunk_size", 1000)),
        chunk_overlap=int(settings.get("chunk_overlap", 200)),
    )


@router.put("", response_model=SettingsResponse)
def update_settings_endpoint(updates: SettingsUpdate, db: Session = Depends(get_db)):
    update_settings(db, updates.model_dump(exclude_none=True))
    return get_settings(db)


@router.post("/test-connection", response_model=TestConnectionResponse)
def test_api_connection(req: TestConnectionRequest):
    success, message = test_connection(req.api_endpoint, req.api_key, req.llm_model)
    return TestConnectionResponse(success=success, message=message)
