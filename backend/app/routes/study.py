from fastapi import APIRouter, HTTPException

from app.schemas import CaseExplanation, ParticipantAssignment, StudyCase
from app.services import StudyService


router = APIRouter(prefix="/api/study", tags=["study"])
service = StudyService()


@router.get("/participants/{participant_code}", response_model=ParticipantAssignment)
def participant_assignment(participant_code: str) -> ParticipantAssignment:
    try:
        return service.participant(participant_code)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Invalid participant code.") from exc


@router.get("/{dataset_id}/cases", response_model=list[StudyCase])
def study_cases(dataset_id: str) -> list[StudyCase]:
    try:
        return service.cases(dataset_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Unknown dataset identifier.") from exc


@router.get("/{dataset_id}/cases/{case_id}/explanations", response_model=CaseExplanation)
def case_explanations(dataset_id: str, case_id: str) -> CaseExplanation:
    try:
        return service.explanation(dataset_id, case_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Unknown dataset identifier.") from exc
    except LookupError as exc:
        raise HTTPException(status_code=404, detail="Unknown study case identifier.") from exc

