from typing import List, Dict, Any, Optional
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document as LCDocument
import hashlib


def process_pdf_text(text: str, metadata: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", " ", ""],
        length_function=len,
    )

    doc = LCDocument(page_content=text, metadata=metadata or {})
    chunks = splitter.split_documents([doc])

    result = []
    for i, chunk in enumerate(chunks):
        chunk_id = hashlib.md5(f"{metadata}_{i}".encode()).hexdigest()
        chunk_metadata = {
            **chunk.metadata,
            "chunk_index": i,
            "total_chunks": len(chunks),
        }
        result.append({
            "id": chunk_id,
            "text": chunk.page_content,
            "metadata": chunk_metadata,
        })

    return result
