from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.document import Document
from app.schemas.schemas import DocumentResponse, DocumentMetadata
from app.services.document_processor import process_pdf_text
from app.services.llm_service import get_embeddings
from app.chroma_client import get_collection
from app.services.settings_service import get_setting
from app.config import settings
import os
import shutil
import aiofiles
from pypdf import PdfReader
import json

router = APIRouter(prefix="/api/documents", tags=["documents"])

UPLOAD_DIR = settings.upload_dir
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    case_number: Optional[str] = Form(None),
    court: Optional[str] = Form(None),
    judge: Optional[str] = Form(None),
    ruling_date: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")

    file_path = os.path.join(UPLOAD_DIR, f"{os.urandom(8).hex()}_{file.filename}")
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(await file.read())

    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        page_count = len(reader.pages)
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"Error al leer PDF: {str(e)}")

    if not text.strip():
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="El PDF no contiene texto extraíble")

    chunk_size = int(get_setting(db, "chunk_size") or 1000)
    chunk_overlap = int(get_setting(db, "chunk_overlap") or 200)

    metadata = {
        "filename": file.filename,
        "case_number": case_number or "",
        "court": court or "",
        "judge": judge or "",
        "ruling_date": ruling_date or "",
    }

    chunks = process_pdf_text(text, metadata)
    texts = [c["text"] for c in chunks]
    embeddings = get_embeddings(texts, db)

    collection = get_collection()
    ids = [c["id"] for c in chunks]
    metadatas = [c["metadata"] for c in chunks]

    collection.add(
        ids=ids,
        documents=texts,
        embeddings=embeddings,
        metadatas=metadatas,
    )

    db_doc = Document(
        filename=os.path.basename(file_path),
        original_filename=file.filename,
        file_size=os.path.getsize(file_path),
        page_count=page_count,
        case_number=case_number,
        court=court,
        judge=judge,
        ruling_date=ruling_date,
        chunk_count=len(chunks),
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    return DocumentResponse(
        id=db_doc.id,
        filename=db_doc.filename,
        original_filename=db_doc.original_filename,
        file_size=db_doc.file_size,
        page_count=db_doc.page_count,
        case_number=db_doc.case_number,
        court=db_doc.court,
        judge=db_doc.judge,
        ruling_date=db_doc.ruling_date,
        chunk_count=db_doc.chunk_count,
        created_at=db_doc.created_at.isoformat() if db_doc.created_at else "",
    )


@router.get("", response_model=List[DocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    return [
        DocumentResponse(
            id=d.id,
            filename=d.filename,
            original_filename=d.original_filename,
            file_size=d.file_size,
            page_count=d.page_count,
            case_number=d.case_number,
            court=d.court,
            judge=d.judge,
            ruling_date=d.ruling_date,
            chunk_count=d.chunk_count,
            created_at=d.created_at.isoformat() if d.created_at else "",
        )
        for d in docs
    ]


@router.delete("/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    collection = get_collection()
    try:
        collection.delete(where={"filename": doc.original_filename})
    except Exception:
        pass

    file_path = os.path.join(UPLOAD_DIR, doc.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(doc)
    db.commit()
    return {"message": "Documento eliminado correctamente"}
