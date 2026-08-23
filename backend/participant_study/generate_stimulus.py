from __future__ import annotations

import hashlib
import json
import random
import time
import traceback
from importlib.metadata import version
from multiprocessing import TimeoutError as ProcessTimeoutError
from pathlib import Path

import dice_ml
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from joblib import Parallel, delayed
from lime.lime_tabular import LimeTabularExplainer


CASE_ID = "SYNTHETIC_ALEX_001"
RANDOM_STATE = 42
NUM_SAMPLES = 5000
NUM_FEATURES = 5
DICE_TIMEOUT_SECONDS = 30
TARGET = "TARGET"
BASE_DIR = Path(__file__).resolve().parents[1]
ARTIFACTS_DIR = BASE_DIR / "artifacts"
OUTPUT_DIR = ARTIFACTS_DIR / "participant_study"

MODEL_PATH = ARTIFACTS_DIR / "xgboost_credit_model.joblib"
PREPROCESSOR_PATH = ARTIFACTS_DIR / "preprocessor.joblib"
RAW_PATH = BASE_DIR / "data" / "raw" / "application_train.csv"
PRIMARY_FEATURES_PATH = ARTIFACTS_DIR / "primary_features.json"
PREPROCESSING_METADATA_PATH = ARTIFACTS_DIR / "preprocessing_metadata.csv"
MODEL_METADATA_PATH = ARTIFACTS_DIR / "model_metadata.json"
TRAIN_INDICES_PATH = ARTIFACTS_DIR / "train_indices.csv"
XAI_CASES_PATH = ARTIFACTS_DIR / "xai_evaluation_cases.csv"

ORIGINAL_FEATURES = [
    "NAME_CONTRACT_TYPE", "AMT_INCOME_TOTAL", "AMT_CREDIT", "AMT_ANNUITY",
    "AMT_GOODS_PRICE", "DAYS_EMPLOYED", "NAME_INCOME_TYPE",
    "NAME_HOUSING_TYPE", "CNT_FAM_MEMBERS", "AMT_REQ_CREDIT_BUREAU_MON",
    "AMT_REQ_CREDIT_BUREAU_QRT", "AMT_REQ_CREDIT_BUREAU_YEAR",
]
BASE_FEATURES = [feature for feature in ORIGINAL_FEATURES if feature != "DAYS_EMPLOYED"] + ["EMPLOYMENT_YEARS"]
DERIVED_FEATURES = ["CREDIT_INCOME_RATIO", "ANNUITY_INCOME_RATIO", "CREDIT_ANNUITY_RATIO"]
FEATURES_TO_VARY = ["AMT_CREDIT", "AMT_ANNUITY", "AMT_GOODS_PRICE"]
DISPLAY_NAMES = {
    "NAME_CONTRACT_TYPE": "Contract type", "AMT_INCOME_TOTAL": "Annual income",
    "AMT_CREDIT": "Requested credit amount", "AMT_ANNUITY": "Annuity amount",
    "AMT_GOODS_PRICE": "Goods price", "CNT_FAM_MEMBERS": "Family members",
    "EMPLOYMENT_YEARS": "Employment duration", "NAME_INCOME_TYPE": "Income type",
    "NAME_HOUSING_TYPE": "Housing type", "CREDIT_INCOME_RATIO": "Credit-to-income ratio",
    "ANNUITY_INCOME_RATIO": "Annuity-to-income ratio", "CREDIT_ANNUITY_RATIO": "Credit-to-annuity ratio",
    "AMT_REQ_CREDIT_BUREAU_MON": "Credit enquiries in previous month",
    "AMT_REQ_CREDIT_BUREAU_QRT": "Credit enquiries in previous quarter",
    "AMT_REQ_CREDIT_BUREAU_YEAR": "Credit enquiries in previous year",
}
SCENARIO = (
    "Financial amounts in this fictional research example are shown in the dataset's recorded units. "
    "Alex is a working applicant who rents their home and has been in their current employment for 1.5 years. "
    "Alex applied for a cash loan of 600,000 for goods priced at 500,000. Their recorded annual income is "
    "180,000 and the loan annuity amount is 30,000. Alex's household has three family members. Credit-bureau "
    "records show no enquiries in the previous month, one in the previous quarter and four in the previous year. "
    "The AI system rejected the application."
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def frozen_hashes() -> dict[str, str]:
    files: list[Path] = []
    for root in (BASE_DIR / "ml", ARTIFACTS_DIR):
        for path in root.rglob("*"):
            if path.is_file() and OUTPUT_DIR not in path.parents:
                files.append(path)
    return {path.relative_to(BASE_DIR).as_posix(): sha256(path) for path in sorted(files)}


def safe_ratio(numerator: pd.Series, denominator: pd.Series) -> pd.Series:
    return numerator.div(denominator.mask(denominator.eq(0), np.nan))


def recalculate_ratios(frame: pd.DataFrame) -> pd.DataFrame:
    result = frame.copy()
    result["CREDIT_INCOME_RATIO"] = safe_ratio(result["AMT_CREDIT"], result["AMT_INCOME_TOTAL"])
    result["ANNUITY_INCOME_RATIO"] = safe_ratio(result["AMT_ANNUITY"], result["AMT_INCOME_TOTAL"])
    result["CREDIT_ANNUITY_RATIO"] = safe_ratio(result["AMT_CREDIT"], result["AMT_ANNUITY"])
    return result.replace([np.inf, -np.inf], np.nan)


def candidate(modelling_features: list[str]) -> pd.DataFrame:
    base = {
        "NAME_CONTRACT_TYPE": "Cash loans", "AMT_INCOME_TOTAL": 180000.0,
        "AMT_CREDIT": 600000.0, "AMT_ANNUITY": 30000.0,
        "AMT_GOODS_PRICE": 500000.0, "NAME_INCOME_TYPE": "Working",
        "NAME_HOUSING_TYPE": "Rented apartment", "CNT_FAM_MEMBERS": 3.0,
        "AMT_REQ_CREDIT_BUREAU_MON": 0.0, "AMT_REQ_CREDIT_BUREAU_QRT": 1.0,
        "AMT_REQ_CREDIT_BUREAU_YEAR": 4.0, "EMPLOYMENT_YEARS": 1.5,
    }
    return recalculate_ratios(pd.DataFrame([base]))[modelling_features]


def modelling_data(modelling_features: list[str]) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.DataFrame]:
    raw = pd.read_csv(RAW_PATH)
    frame = raw[ORIGINAL_FEATURES + [TARGET]].copy()
    employment = frame["DAYS_EMPLOYED"].mask(frame["DAYS_EMPLOYED"].eq(365243), np.nan)
    frame["EMPLOYMENT_YEARS"] = employment.abs().div(365.25)
    frame.drop(columns=["DAYS_EMPLOYED"], inplace=True)
    frame = recalculate_ratios(frame)
    assert frame.columns.drop(TARGET).tolist() == modelling_features
    train_indices = pd.read_csv(TRAIN_INDICES_PATH)["row_index"].astype(int)
    return frame, frame.loc[train_indices, modelling_features].copy(), frame.loc[train_indices, TARGET].copy(), raw


class FrozenPipelineModel:
    def __init__(self, preprocessor, model, modelling_features: list[str], threshold: float):
        self.preprocessor, self.model = preprocessor, model
        self.modelling_features, self.threshold = modelling_features, threshold
        self.classes_ = model.classes_

    def _prepare(self, samples) -> pd.DataFrame:
        frame = samples.copy() if isinstance(samples, pd.DataFrame) else pd.DataFrame(samples, columns=self.modelling_features)
        return recalculate_ratios(frame[self.modelling_features].copy())

    def predict_proba(self, samples):
        return self.model.predict_proba(self.preprocessor.transform(self._prepare(samples)))

    def predict(self, samples):
        return (self.predict_proba(samples)[:, 1] >= self.threshold).astype(int)


def run_dice(explainer, query, ranges):
    try:
        np.random.seed(RANDOM_STATE)
        random.seed(RANDOM_STATE)
        result = explainer.generate_counterfactuals(
            query, total_CFs=1, desired_class=0, features_to_vary=FEATURES_TO_VARY,
            permitted_range=ranges, verbose=False,
        )
        return {"generated": result.cf_examples_list[0].final_cfs_df, "error": "", "exception": ""}
    except Exception as error:
        return {"generated": None, "error": str(error), "exception": type(error).__name__}


def main() -> None:
    hashes_before = frozen_hashes()
    model_hash, preprocessor_hash = sha256(MODEL_PATH), sha256(PREPROCESSOR_PATH)
    modelling_features = json.loads(PRIMARY_FEATURES_PATH.read_text(encoding="utf-8"))
    model_metadata = json.loads(MODEL_METADATA_PATH.read_text(encoding="utf-8"))
    preprocessing_metadata = pd.read_csv(PREPROCESSING_METADATA_PATH)
    threshold = float(model_metadata["decision_threshold"])
    model, preprocessor = joblib.load(MODEL_PATH), joblib.load(PREPROCESSOR_PATH)
    row = candidate(modelling_features)
    probability = float(model.predict_proba(preprocessor.transform(row))[0, 1])
    predicted_class = int(probability >= threshold)
    if not np.isclose(probability, 0.6519815921783447, atol=1e-10) or predicted_class != 1:
        raise RuntimeError(f"Frozen prediction reproduction failed: {probability}, class {predicted_class}")

    full_frame, train_raw, y_train, source_raw = modelling_data(modelling_features)
    base_candidate = row.iloc[0][BASE_FEATURES]
    exact_raw = int((full_frame[BASE_FEATURES].fillna(-999999).astype(str).eq(base_candidate.fillna(-999999).astype(str))).all(axis=1).sum())
    xai_cases = pd.read_csv(XAI_CASES_PATH)
    evaluation_rows = full_frame.loc[xai_cases["row_index"].astype(int), BASE_FEATURES]
    exact_evaluation = int((evaluation_rows.fillna(-999999).astype(str).eq(base_candidate.fillna(-999999).astype(str))).all(axis=1).sum())
    if exact_raw or exact_evaluation:
        raise RuntimeError("Synthetic candidate duplicates a persisted applicant row.")
    domain_valid = {}
    for feature in BASE_FEATURES:
        source = full_frame[feature]
        value = base_candidate[feature]
        domain_valid[feature] = bool(
            value in set(source.dropna().astype(str)) if not pd.api.types.is_numeric_dtype(source)
            else source.min() <= float(value) <= source.max()
        )
    if not all(domain_valid.values()):
        raise RuntimeError("Synthetic candidate contains an out-of-domain value.")

    transformed_names = list(preprocessor.get_feature_names_out())
    transformed = preprocessor.transform(row)
    dense = transformed.toarray() if hasattr(transformed, "toarray") else np.asarray(transformed)
    dmatrix = xgb.DMatrix(dense, feature_names=transformed_names)
    booster = model.get_booster()
    contributions = booster.predict(dmatrix, pred_contribs=True)[0]
    shap_values, base_value = contributions[:-1], float(contributions[-1])
    raw_margin = float(booster.predict(dmatrix, output_margin=True)[0])
    reconstructed_margin = float(base_value + shap_values.sum())
    reconstructed_probability = float(1 / (1 + np.exp(-reconstructed_margin)))
    metadata_lookup = preprocessing_metadata.set_index("transformed_feature")
    shap_rows = []
    for feature in modelling_features:
        positions = [i for i, transformed_feature in enumerate(transformed_names) if metadata_lookup.at[transformed_feature, "original_feature"] == feature]
        value = float(shap_values[positions].sum())
        shap_rows.append({
            "case_id": CASE_ID, "original_feature": feature, "display_feature": DISPLAY_NAMES[feature],
            "display_value": row.iloc[0][feature], "shap_value": value,
            "absolute_shap_value": abs(value),
            "direction": "increases model higher-risk output" if value > 0 else "decreases model higher-risk output",
        })
    shap_all = pd.DataFrame(shap_rows).sort_values("absolute_shap_value", ascending=False).reset_index(drop=True)
    shap_top = shap_all.head(NUM_FEATURES).copy()
    shap_top.insert(1, "rank", range(1, NUM_FEATURES + 1))
    shap_plain = (
        "These factors contributed most to the model's higher-risk prediction: "
        + "; ".join(f"{item.display_feature} {('increased' if item.shap_value > 0 else 'decreased')} the model risk output" for item in shap_top.itertuples())
        + ". These are model associations, not causes or guarantees."
    )

    categorical_features = train_raw.select_dtypes(exclude=np.number).columns.tolist()
    numeric_features = train_raw.select_dtypes(include=np.number).columns.tolist()
    categorical_indexes = [modelling_features.index(feature) for feature in categorical_features]
    numeric_medians = train_raw[numeric_features].median()
    categorical_modes = train_raw[categorical_features].mode(dropna=True).iloc[0]
    category_values = {feature: sorted(train_raw[feature].dropna().astype(str).unique()) for feature in categorical_features}
    category_codes = {feature: {value: code for code, value in enumerate(values)} for feature, values in category_values.items()}
    categorical_names = {modelling_features.index(feature): values for feature, values in category_values.items()}

    def encode(frame: pd.DataFrame) -> pd.DataFrame:
        encoded = frame[modelling_features].copy()
        encoded[numeric_features] = encoded[numeric_features].fillna(numeric_medians)
        for feature in categorical_features:
            encoded[feature] = encoded[feature].fillna(categorical_modes[feature]).astype(str).map(category_codes[feature]).astype(float)
        return encoded.astype(float)

    def decode(samples) -> pd.DataFrame:
        decoded = pd.DataFrame(np.atleast_2d(np.asarray(samples, dtype=float)), columns=modelling_features)
        for feature in categorical_features:
            codes = np.rint(decoded[feature]).astype(int).clip(0, len(category_values[feature]) - 1)
            decoded[feature] = [category_values[feature][code] for code in codes]
        return decoded

    def lime_predict(samples):
        return model.predict_proba(preprocessor.transform(decode(samples)))

    lime_train = encode(train_raw)
    lime_explainer = LimeTabularExplainer(
        training_data=lime_train.to_numpy(), feature_names=modelling_features,
        class_names=["Lower model risk", "Higher model risk"],
        categorical_features=categorical_indexes, categorical_names=categorical_names,
        mode="classification", discretize_continuous=True, random_state=RANDOM_STATE,
    )
    lime_explanation = lime_explainer.explain_instance(
        encode(row).iloc[0].to_numpy(), lime_predict, labels=[1],
        num_features=NUM_FEATURES, num_samples=NUM_SAMPLES,
    )

    def original_feature(rule: str) -> str:
        matches = [feature for feature in modelling_features if feature in rule]
        if not matches:
            raise ValueError(f"Cannot map LIME rule: {rule}")
        return max(matches, key=len)

    lime_rows = []
    for rank, (rule, weight) in enumerate(lime_explanation.as_list(label=1), start=1):
        feature = original_feature(rule)
        display_rule = f"{DISPLAY_NAMES[feature]}: {row.iloc[0][feature]}" if feature in categorical_features else rule.replace(feature, DISPLAY_NAMES[feature])
        if feature == "EMPLOYMENT_YEARS":
            display_rule += " years"
        lime_rows.append({
            "case_id": CASE_ID, "rank": rank, "original_feature": feature,
            "display_feature": DISPLAY_NAMES[feature], "display_rule": display_rule,
            "display_value": row.iloc[0][feature], "lime_weight": float(weight),
            "direction": "increases local higher-risk prediction" if weight > 0 else "decreases local higher-risk prediction",
        })
    lime_top = pd.DataFrame(lime_rows)
    lime_local_prediction = float(np.asarray(lime_explanation.local_pred).reshape(-1)[0])
    lime_fidelity = float(lime_explanation.score)
    lime_error = abs(lime_local_prediction - probability)
    lime_plain = (
        "For this applicant, the local LIME approximation identified: "
        + "; ".join(f"{item.display_feature} {('increased' if item.lime_weight > 0 else 'decreased')} the local higher-risk prediction" for item in lime_top.itertuples())
        + ". This is a local model approximation and does not imply causation."
    )

    continuous = train_raw.select_dtypes(include=np.number).columns.tolist()
    categorical = train_raw.select_dtypes(exclude=np.number).columns.tolist()
    ranges = {}
    for feature in FEATURES_TO_VARY:
        values = train_raw[feature].replace([np.inf, -np.inf], np.nan).dropna()
        lower, upper = values.quantile([0.01, 0.99]).astype(float)
        ranges[feature] = [max(0.0, lower), upper]
    dice_features = train_raw.copy()
    non_derived = [feature for feature in continuous if feature not in DERIVED_FEATURES]
    dice_features[non_derived] = dice_features[non_derived].fillna(train_raw[non_derived].median())
    dice_features[categorical] = dice_features[categorical].fillna(train_raw[categorical].mode(dropna=True).iloc[0])
    dice_features = recalculate_ratios(dice_features)
    dice_training = dice_features.copy()
    dice_training[TARGET] = y_train.to_numpy()
    wrapper = FrozenPipelineModel(preprocessor, model, modelling_features, threshold)
    dice_data = dice_ml.Data(dataframe=dice_training, continuous_features=continuous, outcome_name=TARGET, permitted_range=ranges)
    dice_model = dice_ml.Model(model=wrapper, backend="sklearn", model_type="classifier")
    dice_explainer = dice_ml.Dice(dice_data, dice_model, method="genetic")
    dice_started = time.perf_counter()
    try:
        outcome = Parallel(n_jobs=2, backend="loky", timeout=DICE_TIMEOUT_SECONDS)(
            [delayed(run_dice)(dice_explainer, row, ranges)]
        )[0]
        dice_elapsed = time.perf_counter() - dice_started
    except ProcessTimeoutError:
        outcome = {"generated": None, "error": "Counterfactual search timed out within the allocated computational budget.", "exception": "ProcessTimeoutError"}
        dice_elapsed = time.perf_counter() - dice_started
    except Exception as error:
        outcome = {"generated": None, "error": str(error), "exception": type(error).__name__}
        dice_elapsed = time.perf_counter() - dice_started

    dice_status = {
        "case_id": CASE_ID, "method": "genetic", "timeout_seconds": DICE_TIMEOUT_SECONDS,
        "elapsed_seconds": dice_elapsed, "desired_class": 0, "status": "unavailable",
        "exception_class": outcome["exception"], "error_message": outcome["error"],
        "independently_valid": False,
    }
    dice_counterfactual = pd.DataFrame()
    dice_changes = pd.DataFrame()
    generated = outcome["generated"]
    if generated is not None and not generated.empty:
        candidate_cf = recalculate_ratios(generated.drop(columns=[TARGET], errors="ignore")[modelling_features].copy()).iloc[[0]]
        cf_probability = float(model.predict_proba(preprocessor.transform(candidate_cf))[0, 1])
        cf_class = int(cf_probability >= threshold)
        unchanged = [
            feature for feature in modelling_features
            if feature not in FEATURES_TO_VARY + DERIVED_FEATURES
            and not ((pd.isna(row.iloc[0][feature]) and pd.isna(candidate_cf.iloc[0][feature])) or row.iloc[0][feature] == candidate_cf.iloc[0][feature])
        ]
        ranges_valid = all(ranges[feature][0] <= float(candidate_cf.iloc[0][feature]) <= ranges[feature][1] for feature in FEATURES_TO_VARY)
        ratios_valid = np.allclose(
            candidate_cf.iloc[0][DERIVED_FEATURES].astype(float),
            recalculate_ratios(candidate_cf).iloc[0][DERIVED_FEATURES].astype(float), atol=1e-9,
        )
        valid = cf_class == 0 and not unchanged and ranges_valid and ratios_valid
        dice_status.update({
            "status": "success" if valid else "technical_error", "counterfactual_probability": cf_probability,
            "counterfactual_class": cf_class, "permitted_ranges_respected": ranges_valid,
            "only_permitted_direct_features_changed": not unchanged, "derived_ratios_consistent": ratios_valid,
            "independently_valid": valid,
        })
        if valid:
            dice_counterfactual = candidate_cf.copy()
            dice_counterfactual.insert(0, "case_id", CASE_ID)
            changes = []
            for feature in FEATURES_TO_VARY:
                old, new = float(row.iloc[0][feature]), float(candidate_cf.iloc[0][feature])
                if not np.isclose(old, new):
                    changes.append({
                        "case_id": CASE_ID, "feature": feature, "display_feature": DISPLAY_NAMES[feature],
                        "original_value": old, "counterfactual_value": new, "absolute_change": new - old,
                    })
            dice_changes = pd.DataFrame(changes)

    hashes_after = frozen_hashes()
    if hashes_before != hashes_after:
        raise RuntimeError("A frozen research file changed during synthetic stimulus generation.")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=False)
    stimulus = {
        "case_id": CASE_ID, "synthetic": True, "creation_purpose": "Single fictional participant-study stimulus",
        "participant_scenario": SCENARIO, "base_inputs": {feature: row.iloc[0][feature] for feature in BASE_FEATURES},
        "derived_ratios": {feature: float(row.iloc[0][feature]) for feature in DERIVED_FEATURES},
        "frozen_model_probability": probability, "frozen_predicted_class": predicted_class,
        "decision": "rejected / higher model risk", "decision_threshold": threshold,
        "frozen_model_sha256": model_hash, "frozen_preprocessor_sha256": preprocessor_hash,
        "duplicate_audit": {"exact_raw_base_feature_matches": exact_raw, "exact_xai_evaluation_matches": exact_evaluation, "copied_from_existing_applicant": False},
        "domain_validation": domain_valid,
    }
    (OUTPUT_DIR / "stimulus.json").write_text(json.dumps(stimulus, indent=2, default=str), encoding="utf-8")
    (OUTPUT_DIR / "canonical_display_labels.json").write_text(json.dumps(DISPLAY_NAMES, indent=2), encoding="utf-8")
    (OUTPUT_DIR / "research_hash_manifest.json").write_text(json.dumps(hashes_before, indent=2), encoding="utf-8")
    shap_all.to_csv(OUTPUT_DIR / "shap_all_factors.csv", index=False)
    shap_top.to_csv(OUTPUT_DIR / "shap_top_factors.csv", index=False)
    (OUTPUT_DIR / "shap_explanation.json").write_text(json.dumps({
        "case_id": CASE_ID, "method": "XGBoost native pred_contribs", "output_space": "raw margin / log-odds",
        "base_value": base_value, "raw_margin": raw_margin, "reconstructed_margin": reconstructed_margin,
        "reconstructed_probability": reconstructed_probability,
        "maximum_additivity_difference": abs(raw_margin - reconstructed_margin),
        "probability_reconstruction_difference": abs(probability - reconstructed_probability),
        "plain_english": shap_plain,
    }, indent=2), encoding="utf-8")
    lime_top.to_csv(OUTPUT_DIR / "lime_top_factors.csv", index=False)
    (OUTPUT_DIR / "lime_explanation.json").write_text(json.dumps({
        "case_id": CASE_ID, "method": "LIME tabular", "random_seed": RANDOM_STATE,
        "num_samples": NUM_SAMPLES, "num_features": NUM_FEATURES,
        "frozen_model_probability": probability, "local_surrogate_prediction": lime_local_prediction,
        "local_fidelity_r2": lime_fidelity, "absolute_local_prediction_error": lime_error,
        "plain_english": lime_plain,
    }, indent=2), encoding="utf-8")
    (OUTPUT_DIR / "dice_status.json").write_text(json.dumps(dice_status, indent=2), encoding="utf-8")
    if not dice_counterfactual.empty:
        dice_counterfactual.to_csv(OUTPUT_DIR / "dice_counterfactual.csv", index=False)
        dice_changes.to_csv(OUTPUT_DIR / "dice_feature_changes.csv", index=False)
    (OUTPUT_DIR / "generation_metadata.json").write_text(json.dumps({
        "case_id": CASE_ID, "random_seed": RANDOM_STATE, "model_retrained": False,
        "preprocessor_refitted": False, "threshold_changed": False,
        "existing_xai_artifacts_overwritten": False, "frontend_modified": False,
        "shap_backend": "XGBoost native pred_contribs", "lime_version": version("lime"),
        "dice_version": version("dice-ml"), "xgboost_version": xgb.__version__,
    }, indent=2), encoding="utf-8")
    print(json.dumps({
        "case_id": CASE_ID, "probability": probability, "class": predicted_class,
        "shap_additivity_difference": abs(raw_margin - reconstructed_margin),
        "lime_fidelity_r2": lime_fidelity, "lime_prediction_error": lime_error,
        "dice": dice_status, "output_dir": str(OUTPUT_DIR),
    }, indent=2))


if __name__ == "__main__":
    main()
