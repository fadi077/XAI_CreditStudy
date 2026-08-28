from fastapi import APIRouter, HTTPException

from app.schemas import ParticipantStimulus
from app.services import ParticipantStudyService


router = APIRouter(prefix="/api/participant-study", tags=["participant-study"])
service = ParticipantStudyService()


@router.get("/stimulus/{participant_code}", response_model=ParticipantStimulus)
def participant_stimulus(participant_code: str) -> ParticipantStimulus:
    try:
        return service.stimulus(participant_code)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Invalid participant code.") from exc
