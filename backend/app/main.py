from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import FRONTEND_ORIGIN
from app.routes import datasets_router, health_router, participant_study_router, study_router
from app.services import ArtifactError

app = FastAPI(
    title="XAI Credit Study API",
    version="1.0.0",
    description="Backend API for the Explainable AI Credit Decision research project",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["Accept", "Content-Type"],
)


@app.exception_handler(ArtifactError)
async def artifact_error_handler(_: Request, exc: ArtifactError) -> JSONResponse:
    status_code = 503 if exc.missing else 500
    return JSONResponse(status_code=status_code, content={"detail": str(exc)})


@app.exception_handler(ValueError)
async def malformed_artifact_handler(_: Request, __: ValueError) -> JSONResponse:
    return JSONResponse(status_code=500, content={"detail": "Persisted artifact is malformed."})


app.include_router(health_router)
app.include_router(datasets_router)
app.include_router(study_router)
app.include_router(participant_study_router)
