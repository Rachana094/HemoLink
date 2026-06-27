"""
HemoLink — AI-Orchestrated Blood Supply Chain Intelligence Platform
Main FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from backend.core.config import settings
from backend.api import donors, matching, predictions, analytics, blood_banks, whatsapp


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=settings.APP_DESCRIPTION,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # ── CORS ──
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── API Routes ──
    app.include_router(donors.router)
    app.include_router(matching.router)
    app.include_router(predictions.router)
    app.include_router(analytics.router)
    app.include_router(blood_banks.router)
    app.include_router(whatsapp.router)

    # ── Health Check ──
    @app.get("/health")
    async def health_check():
        return {
            "status": "healthy",
            "platform": settings.APP_NAME,
            "version": settings.APP_VERSION,
        }

    # ── Static Files (Frontend) ──
    frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
    if os.path.isdir(frontend_dir):
        app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="static")

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
