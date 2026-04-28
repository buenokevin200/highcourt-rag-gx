from sqlalchemy import Column, Integer, String, DateTime, Text, Integer as IntCol
from sqlalchemy.sql import func
from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_size = Column(Integer, default=0)
    page_count = Column(Integer, default=0)
    case_number = Column(String, nullable=True)
    court = Column(String, nullable=True)
    judge = Column(String, nullable=True)
    ruling_date = Column(String, nullable=True)
    chunk_count = Column(Integer, default=0)
    uploaded_by = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
