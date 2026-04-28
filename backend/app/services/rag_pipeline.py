from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.chroma_client import get_collection
from app.services.llm_service import get_embedding, query_llm
from app.services.settings_service import get_setting


def rag_query(query: str, db: Session, top_k: Optional[int] = None) -> tuple[str, List[Dict[str, Any]]]:
    k = top_k or int(get_setting(db, "top_k") or 5)
    embedding = get_embedding(query, db)
    collection = get_collection()

    results = collection.query(
        query_embeddings=[embedding],
        n_results=k,
        include=["documents", "metadatas", "distances"],
    )

    chunks = []
    sources_set = set()
    sources = []

    if results["documents"] and results["documents"][0]:
        for i, doc in enumerate(results["documents"][0]):
            metadata = results["metadatas"][0][i] if results["metadatas"] else {}
            distance = results["distances"][0][i] if results["distances"] else 0
            source_key = metadata.get("filename", "unknown")
            chunks.append(f"[Fuente: {source_key}]\n{doc}")

            if source_key not in sources_set:
                sources_set.add(source_key)
                sources.append({
                    "filename": source_key,
                    "case_number": metadata.get("case_number", ""),
                    "court": metadata.get("court", ""),
                    "score": round(1 - distance, 4),
                })

    context = "\n\n---\n\n".join(chunks) if chunks else "No se encontraron documentos relevantes."

    prompt = f"""Eres un asistente legal especializado en jurisprudencia de la High Court.
Tu función es responder preguntas basándote exclusivamente en los fragmentos de sentencias proporcionados.

Contexto de sentencias:
{context}

Pregunta del usuario: {query}

Instrucciones:
1. Responde de forma clara y precisa basándote SOLO en el contexto proporcionado.
2. Si el contexto no contiene información suficiente para responder, indícalo claramente.
3. Cita las fuentes de las que extraes la información (número de caso, tribunal).
4. Si mencionas artículos o leyes específicas, incluye la referencia exacta.
5. Responde en español formal, como corresponde a un entorno judicial.

Respuesta:"""

    answer = query_llm(prompt, db)

    return answer, sources
