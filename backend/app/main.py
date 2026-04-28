from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, SessionLocal, Base
from app.models.user import User
from app.models.document import Document
from app.models.settings import Setting
from app.routers import chat, documents, settings, auth
from app.config import settings as app_settings
from passlib.context import CryptContext
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title=app_settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(settings.router)
app.include_router(auth.router)

os.makedirs(app_settings.upload_dir, exist_ok=True)


@app.on_event("startup")
def startup():
    os.makedirs("/app/data", exist_ok=True)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin_user = User(
                username="admin",
                email="admin@highcourt.gov",
                hashed_password=pwd_context.hash("admin123"),
                is_admin=True,
            )
            db.add(admin_user)
            db.commit()
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"status": "ok", "app": app_settings.app_name}
