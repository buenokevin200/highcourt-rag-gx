import chromadb
from chromadb.config import Settings as ChromaSettings
from app.config import settings as app_settings

chroma_client = chromadb.HttpClient(
    host=app_settings.chroma_host,
    port=app_settings.chroma_port,
    settings=ChromaSettings(allow_reset=True, anonymized_telemetry=False),
)


def get_collection():
    try:
        return chroma_client.get_collection(app_settings.chroma_collection)
    except Exception:
        return chroma_client.create_collection(app_settings.chroma_collection)
