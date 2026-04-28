from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.settings import Setting


DEFAULT_SETTINGS = {
    "api_endpoint": "https://api.openai.com/v1",
    "api_key": "",
    "llm_model": "gpt-4o-mini",
    "embedding_model": "text-embedding-3-small",
    "temperature": "0.1",
    "top_k": "5",
    "chunk_size": "1000",
    "chunk_overlap": "200",
}


def get_setting(db: Session, key: str) -> Optional[str]:
    setting = db.query(Setting).filter(Setting.key == key).first()
    return setting.value if setting else DEFAULT_SETTINGS.get(key)


def set_setting(db: Session, key: str, value: str):
    setting = db.query(Setting).filter(Setting.key == key).first()
    if setting:
        setting.value = value
    else:
        setting = Setting(key=key, value=value)
        db.add(setting)
    db.commit()


def get_all_settings(db: Session) -> Dict[str, str]:
    settings: Dict[str, str] = {}
    db_settings = db.query(Setting).all()
    db_setting_keys = {s.key for s in db_settings}
    for s in db_settings:
        settings[s.key] = s.value or ""
    for key, default in DEFAULT_SETTINGS.items():
        if key not in db_setting_keys:
            settings[key] = default
    return settings


def update_settings(db: Session, updates: Dict[str, Any]):
    for key, value in updates.items():
        if value is not None and key in DEFAULT_SETTINGS:
            set_setting(db, key, str(value))
