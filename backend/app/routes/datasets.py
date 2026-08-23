from fastapi import APIRouter, HTTPException

from app.schemas import DatasetDetail, DatasetSummary
from app.services import StudyService


router = APIRouter(prefix="/api/datasets", tags=["datasets"])
service = StudyService()


@router.get("", response_model=list[DatasetSummary])
def list_datasets() -> list[DatasetSummary]:
    return service.datasets()


@router.get("/{dataset_id}", response_model=DatasetDetail)
def dataset_detail(dataset_id: str) -> DatasetDetail:
    try:
        return service.dataset_detail(dataset_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Unknown dataset identifier.") from exc

