from pathlib import Path

from app.config import ARTIFACTS_ROOT
from app.schemas import (
    ParticipantChange,
    ParticipantExplanation,
    ParticipantFactor,
    ParticipantPrediction,
    ParticipantScenario,
    ParticipantStimulus,
)
from app.services.artifact_service import ArtifactService
from app.services.study_service import PARTICIPANT_METHODS


CASE_ID = "SYNTHETIC_ALEX_001"
STUDY_ARTIFACTS = ARTIFACTS_ROOT / "participant_study"
SCENARIO = ParticipantScenario(
    title="Fictional Research Scenario",
    paragraphs=[
        "Alex is a working applicant who rents their home and has been in their current employment for 1.5 years.",
        "Alex has applied for a cash loan of 600,000 for goods priced at 500,000. Their recorded annual income is 180,000, and the loan annuity amount is 30,000. Financial amounts in this fictional example are shown using the dataset’s recorded units rather than a real-world currency.",
        "Alex’s household has three family members. Credit-bureau records show no enquiries in the previous month, one enquiry in the previous quarter, and four enquiries in the previous year.",
        "After assessing this information, the AI system classified the application as higher risk.",
        "AI decision: Application rejected.",
    ],
    notice="This is a fictional research example. It does not represent a real applicant and is not financial advice.",
)


class ParticipantStudyService:
    def __init__(self, artifact_directory: Path = STUDY_ARTIFACTS):
        self.directory = artifact_directory

    def stimulus(self, participant_code: str) -> ParticipantStimulus:
        code = participant_code.strip().upper()
        method = PARTICIPANT_METHODS.get(code)
        if method is None:
            raise KeyError(code)

        stimulus = ArtifactService._read_json(self.directory / "stimulus.json")
        if stimulus.get("case_id") != CASE_ID or stimulus.get("frozen_predicted_class") != 1:
            raise ValueError("Malformed persisted participant stimulus.")

        return ParticipantStimulus(
            participant_code=code,
            case_id=CASE_ID,
            assigned_method=method,
            scenario=SCENARIO,
            prediction=ParticipantPrediction(decision="Application rejected"),
            explanation=self._explanation(method),
        )

    def _explanation(self, method: str) -> ParticipantExplanation:
        if method == "SHAP":
            rows = ArtifactService._read_csv(self.directory / "shap_top_factors.csv")
            return ParticipantExplanation(
                method=method,
                introduction="These factors contributed most strongly to the AI model's decision.",
                factors=[self._factor(row, use_rule=False) for row in rows],
                notice="These are model associations, not causes or guarantees.",
            )
        if method == "LIME":
            rows = ArtifactService._read_csv(self.directory / "lime_top_factors.csv")
            return ParticipantExplanation(
                method=method,
                introduction="These factors were most influential in the local explanation of this decision.",
                factors=[self._factor(row, use_rule=True) for row in rows],
                notice="This is a local model explanation and does not imply causation.",
            )

        status = ArtifactService._read_json(self.directory / "dice_status.json")
        if status.get("case_id") != CASE_ID or not status.get("independently_valid"):
            raise ValueError("Persisted participant counterfactual is not validated.")
        rows = ArtifactService._read_csv(self.directory / "dice_feature_changes.csv")
        return ParticipantExplanation(
            method=method,
            introduction="Under the model, this alternative combination of loan-related values changes the predicted decision.",
            changes=[
                ParticipantChange(
                    label=row["display_feature"],
                    original_value=ArtifactService.display_value(row["original_value"]),
                    alternative_value=ArtifactService.display_value(row["counterfactual_value"]),
                )
                for row in rows
            ],
            notice="This is a model-based alternative, not financial advice or a guaranteed real-world outcome.",
        )

    @staticmethod
    def _factor(row: dict[str, str], *, use_rule: bool) -> ParticipantFactor:
        rank = ArtifactService.integer(row.get("rank"))
        if rank is None:
            raise ValueError("Malformed persisted participant explanation.")
        label = row.get("display_rule") if use_rule else row.get("display_feature")
        if not label:
            raise ValueError("Malformed persisted participant explanation.")
        direction = row.get("direction", "").replace("model higher-risk output", "the model's higher-risk prediction")
        direction = direction.replace("local higher-risk prediction", "the local higher-risk prediction")
        return ParticipantFactor(
            rank=rank,
            label=label,
            value=ArtifactService.display_value(row.get("display_value")),
            direction=direction,
        )
