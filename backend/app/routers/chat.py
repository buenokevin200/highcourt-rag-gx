from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.schemas import (
    ChatRequest, ChatResponse, TestConnectionRequest, TestConnectionResponse,
)
from app.services.rag_pipeline import rag_query
from app.services.llm_service import test_connection
from app.services.settings_service import get_setting
import uuid

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    conversation_id = request.conversation_id or str(uuid.uuid4())
    api_key = get_setting(db, "api_key")
    if not api_key:
        raise HTTPException(status_code=400, detail="API key no configurada. Ve a Admin Settings.")

    answer, sources = rag_query(request.query, db)
    return ChatResponse(answer=answer, sources=sources, conversation_id=conversation_id)
