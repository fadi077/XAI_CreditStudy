from fastapi import APIRouter

from app.config import DATASET_REGISTRY
from app.services import ArtifactService


router = APIRouter(tags=["service"])
artifacts = ArtifactService()


@router.get("/")
def root() -> dict[str, str]:
    return {"service": "XAI CreditStudy API", "status": "running", "version": "1.0.0"}


@router.get("/health")
def health() -> dict[str, str | int | bool]:
    available = artifacts.registry_available()
    return {
        "status": "ok" if available else "degraded",
        "datasets": len(DATASET_REGISTRY),
        "artifact_registry_loaded": available,
    }

