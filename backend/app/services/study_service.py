from app.config import DATASET_REGISTRY
from app.schemas import (
    CaseExplanation, CounterfactualChange, DatasetDetail, DatasetMetrics,
    DatasetSummary, DiceExplanation, LimeExplanation, ParticipantAssignment,
    PredictionSummary, ShapExplanation, StudyCase, TopFactor,
)
from app.services.artifact_service import ArtifactService


PARTICIPANT_METHODS = {
    **{f"P{number:02d}": "SHAP" for number in range(1, 5)},
    **{f"P{number:02d}": "LIME" for number in range(5, 8)},
    **{f"P{number:02d}": "DiCE" for number in range(8, 11)},
}


class StudyService:
    def __init__(self, artifacts: ArtifactService | None = None):
        self.artifacts = artifacts or ArtifactService()

    def datasets(self) -> list[DatasetSummary]:
        return [
            DatasetSummary(
                dataset_id=dataset_id,
                display_name=entry.display_name,
                xai_case_count=len(self.artifacts.csv(dataset_id, entry.xai_case_file)),
            )
            for dataset_id, entry in DATASET_REGISTRY.items()
        ]

    def dataset_detail(self, dataset_id: str) -> DatasetDetail:
        entry = self.artifacts.dataset(dataset_id)
        model = self.artifacts.json(dataset_id, entry.model_metadata_file)
        evaluation = self.artifacts.json(dataset_id, entry.evaluation_metadata_file)
        cases = self.artifacts.csv(dataset_id, entry.xai_case_file)

        if dataset_id == "home_credit":
            metrics_source = model
            model_type = model.get("selected_model")
            test_rows = model.get("test_rows")
        elif dataset_id == "german_credit":
            metrics_source = model.get("test_metrics", {})
            model_type = model.get("selected_model_name")
            test_rows = model.get("test_rows")
        else:
            metrics_source = model.get("final_holdout_metrics", {})
            model_type = model.get("selected_model")
            test_rows = model.get("test_rows")

        valid_dice = evaluation.get("valid_dice_counterfactual_count")

        home_fields = {}
        if dataset_id == "home_credit":
            home_fields = {
                "base_features": 12,
                "engineered_features": 3,
                "modelling_inputs": 15,
                "provenance_note": (
                    "Persisted metadata reports 12 original/base features; the primary input list also "
                    "contains three engineered ratios, giving 15 modelling inputs. Stage 08 artifacts "
                    "exist, while notebook execution provenance is less complete than for the other datasets."
                ),
            }

        return DatasetDetail(
            dataset_id=dataset_id,
            display_name=entry.display_name,
            xai_case_count=len(cases),
            model_type=str(model_type) if model_type is not None else None,
            decision_threshold=self.artifacts.number(model.get("decision_threshold")),
            test_rows=self.artifacts.integer(test_rows),
            valid_dice_counterfactual_count=self.artifacts.integer(valid_dice),
            metrics=DatasetMetrics(
                roc_auc=self.artifacts.number(metrics_source.get("roc_auc")),
                pr_auc=self.artifacts.number(metrics_source.get("pr_auc")),
                balanced_accuracy=self.artifacts.number(metrics_source.get("balanced_accuracy")),
                f1_positive=self.artifacts.number(metrics_source.get("f1_positive")),
            ),
            **home_fields,
        )

    def cases(self, dataset_id: str) -> list[StudyCase]:
        entry = self.artifacts.dataset(dataset_id)
        rows = self.artifacts.csv(dataset_id, entry.xai_case_file)
        result = []
        for row in rows:
            predicted_class = self.artifacts.integer(row.get("predicted_class"))
            probability = self.artifacts.number(row.get("predicted_probability"))
            if predicted_class is None or probability is None or not row.get("case_id"):
                raise ValueError("Malformed persisted case artifact.")
            result.append(StudyCase(
                case_id=row["case_id"], predicted_class=predicted_class,
                predicted_probability=probability, case_type=row.get("case_type", ""),
            ))
        return result

    def participant(self, participant_code: str) -> ParticipantAssignment:
        code = participant_code.strip().upper()
        method = PARTICIPANT_METHODS.get(code)
        if method is None:
            raise KeyError(code)
        return ParticipantAssignment(participant_code=code, assigned_method=method)

    def explanation(self, dataset_id: str, case_id: str) -> CaseExplanation:
        cases = {case.case_id: case for case in self.cases(dataset_id)}
        case = cases.get(case_id)
        if case is None:
            raise LookupError(case_id)
        shap = self._factors(dataset_id, case_id, "shap")
        lime = self._factors(dataset_id, case_id, "lime")
        dice = self._dice(dataset_id, case_id)
        return CaseExplanation(
            dataset_id=dataset_id,
            case_id=case_id,
            prediction=PredictionSummary(
                predicted_class=case.predicted_class,
                predicted_probability=case.predicted_probability,
            ),
            shap=ShapExplanation(available=bool(shap), top_factors=shap),
            lime=LimeExplanation(
                available=bool(lime), top_factors=lime,
                local_fidelity_r2=self._lime_fidelity(dataset_id, case_id),
            ),
            dice=dice,
        )

    def _factors(self, dataset_id: str, case_id: str, method: str) -> list[TopFactor]:
        filename = f"{method}_top_factors.csv"
        rows = [row for row in self.artifacts.csv(dataset_id, filename) if row.get("case_id") == case_id]
        contribution_name = "shap_value" if method == "shap" else "lime_weight"
        factors = []
        for row in rows:
            contribution = self.artifacts.number(row.get(contribution_name))
            rank = self.artifacts.integer(row.get("rank"))
            if contribution is None or rank is None:
                raise ValueError("Malformed persisted explanation artifact.")
            feature = row.get("original_feature") or row.get("feature") or ""
            factors.append(TopFactor(
                rank=rank,
                feature=feature,
                display_feature=row.get("display_feature") or feature,
                display_value=self.artifacts.display_value(row.get("display_value")),
                contribution=contribution,
                direction=row.get("direction", ""),
                rule=row.get("display_rule") or row.get("feature_rule") or None,
            ))
        return sorted(factors, key=lambda factor: factor.rank)

    def _lime_fidelity(self, dataset_id: str, case_id: str) -> float | None:
        try:
            rows = self.artifacts.csv(dataset_id, "lime_local_fidelity.csv")
        except Exception as error:
            if getattr(error, "missing", False):
                rows = self.artifacts.csv(dataset_id, "lime_top_factors.csv")
            else:
                raise
        row = next((item for item in rows if item.get("case_id") == case_id), None)
        return self.artifacts.number(row.get("local_fidelity_r2")) if row else None

    def _dice(self, dataset_id: str, case_id: str) -> DiceExplanation:
        status_rows = self.artifacts.csv(dataset_id, "dice_final_case_status.csv")
        status = next((row for row in status_rows if row.get("case_id") == case_id), None)
        if status is None:
            raise ValueError("Malformed persisted DiCE status artifact.")
        available = self.artifacts.boolean(status.get("valid_counterfactual_available"))
        final_status = status.get("final_status") or "unavailable"
        counterfactual_probability = None
        changes: list[CounterfactualChange] = []
        if available:
            counterfactuals = [row for row in self.artifacts.csv(dataset_id, "dice_counterfactuals.csv") if row.get("case_id") == case_id]
            if counterfactuals:
                counterfactual_probability = self.artifacts.number(counterfactuals[0].get("counterfactual_probability"))
            for row in self.artifacts.csv(dataset_id, "dice_feature_changes.csv"):
                if row.get("case_id") != case_id or not self.artifacts.boolean(row.get("changed")):
                    continue
                feature = row.get("feature", "")
                changes.append(CounterfactualChange(
                    feature=feature,
                    display_feature=row.get("display_feature") or feature,
                    original_value=self.artifacts.display_value(row.get("original_value")),
                    counterfactual_value=self.artifacts.display_value(row.get("counterfactual_value")),
                ))
        terminology = (
            "counterfactual-modifiable financial-state variable"
            if dataset_id == "heloc" else "permitted counterfactual feature"
        )
        message = (
            "Valid counterfactual returned under the configured search constraints."
            if available else
            "No valid counterfactual returned under the configured search constraints."
        )
        return DiceExplanation(
            available=available, final_status=final_status, status_message=message,
            counterfactual_probability=counterfactual_probability, changes=changes,
            actionability_terminology=terminology,
        )
