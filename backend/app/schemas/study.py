from pydantic import BaseModel


DisplayValue = str | int | float | None


class StudyCase(BaseModel):
    case_id: str
    predicted_class: int
    predicted_probability: float
    case_type: str


class ParticipantAssignment(BaseModel):
    participant_code: str
    assigned_method: str


class ParticipantFactor(BaseModel):
    rank: int
    label: str
    value: DisplayValue = None
    direction: str


class ParticipantChange(BaseModel):
    label: str
    original_value: DisplayValue
    alternative_value: DisplayValue


class ParticipantExplanation(BaseModel):
    method: str
    introduction: str
    factors: list[ParticipantFactor] = []
    changes: list[ParticipantChange] = []
    notice: str


class ParticipantScenario(BaseModel):
    title: str
    paragraphs: list[str]
    notice: str


class ParticipantPrediction(BaseModel):
    decision: str


class ParticipantStimulus(BaseModel):
    participant_code: str
    case_id: str
    assigned_method: str
    scenario: ParticipantScenario
    prediction: ParticipantPrediction
    explanation: ParticipantExplanation


class PredictionSummary(BaseModel):
    predicted_class: int
    predicted_probability: float


class TopFactor(BaseModel):
    rank: int
    feature: str
    display_feature: str
    display_value: DisplayValue = None
    contribution: float
    direction: str
    rule: str | None = None


class ShapExplanation(BaseModel):
    available: bool
    top_factors: list[TopFactor]


class LimeExplanation(BaseModel):
    available: bool
    top_factors: list[TopFactor]
    local_fidelity_r2: float | None = None


class CounterfactualChange(BaseModel):
    feature: str
    display_feature: str
    original_value: DisplayValue
    counterfactual_value: DisplayValue


class DiceExplanation(BaseModel):
    available: bool
    final_status: str
    status_message: str
    counterfactual_probability: float | None = None
    changes: list[CounterfactualChange]
    actionability_terminology: str


class CaseExplanation(BaseModel):
    dataset_id: str
    case_id: str
    prediction: PredictionSummary
    shap: ShapExplanation
    lime: LimeExplanation
    dice: DiceExplanation
