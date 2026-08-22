from fastapi import FastAPI


app = FastAPI(
    title="XAI Credit Study API",
    version="1.0.0",
    description="Backend API for the Explainable AI Credit Decision research project",
)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "XAI Credit Study backend is running"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}
