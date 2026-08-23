from pydantic import BaseModel


class DatasetSummary(BaseModel):
    dataset_id: str
    display_name: str
    xai_case_count: int


class DatasetMetrics(BaseModel):
    roc_auc: float | None = None
    pr_auc: float | None = None
    balanced_accuracy: float | None = None
    f1_positive: float | None = None


class DatasetDetail(DatasetSummary):
    model_type: str | None = None
    decision_threshold: float | None = None
    test_rows: int | None = None
    valid_dice_counterfactual_count: int | None = None
    metrics: DatasetMetrics
    base_features: int | None = None
    engineered_features: int | None = None
    modelling_inputs: int | None = None
    provenance_note: str | None = None

