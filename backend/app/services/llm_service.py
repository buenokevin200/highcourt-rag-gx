from typing import List, Optional
from openai import OpenAI
from sqlalchemy.orm import Session
from app.services.settings_service import get_setting


def get_openai_client(db: Session) -> OpenAI:
    api_endpoint = get_setting(db, "api_endpoint") or "https://api.openai.com/v1"
    api_key = get_setting(db, "api_key") or ""
    return OpenAI(base_url=api_endpoint, api_key=api_key)


def get_embedding(text: str, db: Session) -> List[float]:
    client = get_openai_client(db)
    model = get_setting(db, "embedding_model") or "text-embedding-3-small"
    response = client.embeddings.create(input=text, model=model)
    return response.data[0].embedding


def get_embeddings(texts: List[str], db: Session) -> List[List[float]]:
    if not texts:
        return []
    client = get_openai_client(db)
    model = get_setting(db, "embedding_model") or "text-embedding-3-small"
    response = client.embeddings.create(input=texts, model=model)
    return [item.embedding for item in response.data]


def query_llm(prompt: str, db: Session, temperature: Optional[float] = None) -> str:
    client = get_openai_client(db)
    model = get_setting(db, "llm_model") or "gpt-4o-mini"
    temp = temperature if temperature is not None else float(get_setting(db, "temperature") or 0.1)

    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=temp,
    )
    return response.choices[0].message.content or ""


def test_connection(api_endpoint: str, api_key: str, llm_model: str) -> tuple[bool, str]:
    try:
        client = OpenAI(base_url=api_endpoint, api_key=api_key)
        response = client.chat.completions.create(
            model=llm_model,
            messages=[{"role": "user", "content": "test"}],
            max_tokens=5,
        )
        if response.choices:
            return True, "Conexión exitosa"
        return False, "No se recibió respuesta del modelo"
    except Exception as e:
        return False, f"Error de conexión: {str(e)}"
