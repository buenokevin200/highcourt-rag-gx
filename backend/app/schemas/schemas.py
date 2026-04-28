from pydantic import BaseModel, Field
from typing import Optional, List


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=4000)
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    sources: List[dict] = []
    conversation_id: str


class DocumentResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_size: int
    page_count: int
    case_number: Optional[str] = None
    court: Optional[str] = None
    judge: Optional[str] = None
    ruling_date: Optional[str] = None
    chunk_count: int
    created_at: str

    class Config:
        from_attributes = True


class DocumentMetadata(BaseModel):
    case_number: Optional[str] = None
    court: Optional[str] = None
    judge: Optional[str] = None
    ruling_date: Optional[str] = None


class SettingsUpdate(BaseModel):
    api_endpoint: Optional[str] = None
    api_key: Optional[str] = None
    llm_model: Optional[str] = None
    embedding_model: Optional[str] = None
    temperature: Optional[float] = None
    top_k: Optional[int] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None


class SettingsResponse(BaseModel):
    api_endpoint: str = ""
    llm_model: str = ""
    embedding_model: str = ""
    temperature: float = 0.1
    top_k: int = 5
    chunk_size: int = 1000
    chunk_overlap: int = 200


class TestConnectionRequest(BaseModel):
    api_endpoint: str
    api_key: str
    llm_model: str


class TestConnectionResponse(BaseModel):
    success: bool
    message: str


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
