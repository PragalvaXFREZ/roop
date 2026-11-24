"""
The FastAPI application.

The Next.js server sends every /api request to this app.
Thus, the browser sees one origin, and the session cookie works without CORS.
"""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routes import admin, public

app = FastAPI(title="Roop API")
app.include_router(public.router)
app.include_router(admin.router)
app.include_router(admin.guarded)

settings.upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/api/health")
def health():
    return {"ok": True}
