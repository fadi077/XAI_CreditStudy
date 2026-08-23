from __future__ import annotations

import json
import random
import time
import traceback
from datetime import datetime, timezone
from multiprocessing import TimeoutError as ProcessTimeoutError

import dice_ml
import joblib
import numpy as np
import pandas as pd
from joblib import Parallel, delayed

from participant_study.generate_stimulus import (
    ARTIFACTS_DIR, BASE_DIR, CASE_ID, DERIVED_FEATURES, DISPLAY_NAMES,
    FEATURES_TO_VARY, MODEL_PATH, OUTPUT_DIR, PREPROCESSOR_PATH, PRIMARY_FEATURES_PATH,
    RANDOM_STATE, RAW_PATH, TARGET, TRAIN_INDICES_PATH, FrozenPipelineModel,
    candidate, frozen_hashes, modelling_data, recalculate_ratios, sha256,
)


RETRY_TIMEOUT_SECONDS = 90
RETRY_PATH = OUTPUT_DIR / "dice_technical_retry.json"
COUNTERFACTUAL_PATH = OUTPUT_DIR / "dice_counterfactual.csv"
CHANGES_PATH = OUTPUT_DIR / "dice_feature_changes.csv"
STATUS_PATH = OUTPUT_DIR / "dice_status.json"


def guarded_search(explainer, query, ranges):
    import dice_ml.explainer_interfaces.dice_genetic as genetic_module

    original_randrange = genetic_module.random.randrange

    def sole_parent_safe_randrange(*args):
        if len(args) == 1 and args[0] == 0:
            return 0
        return original_randrange(*args)

    genetic_module.random.randrange = sole_parent_safe_randrange
    try:
        np.random.seed(RANDOM_STATE)
        random.seed(RANDOM_STATE)
        result = explainer.generate_counterfactuals(
            query, total_CFs=1, desired_class=0,
            features_to_vary=FEATURES_TO_VARY, permitted_range=ranges, verbose=False,
        )
        frame = result.cf_examples_list[0].final_cfs_df
        return {"generated": frame, "error": "", "exception": "", "traceback": ""}
    except Exception as error:
        return {
            "generated": None, "error": str(error),
            "exception": type(error).__name__, "traceback": traceback.format_exc(),
        }
    finally:
        genetic_module.random.randrange = original_randrange


def main() -> None:
    if RETRY_PATH.exists():
        raise FileExistsError("The single controlled DiCE technical retry has already been performed.")

    hashes_before = frozen_hashes()
    shap_paths = sorted(OUTPUT_DIR.glob("shap_*"))
    lime_paths = sorted(OUTPUT_DIR.glob("lime_*"))
    shap_hashes_before = {path.name: sha256(path) for path in shap_paths}
    lime_hashes_before = {path.name: sha256(path) for path in lime_paths}

    modelling_features = json.loads(PRIMARY_FEATURES_PATH.read_text(encoding="utf-8"))
    stimulus = json.loads((OUTPUT_DIR / "stimulus.json").read_text(encoding="utf-8"))
    query = candidate(modelling_features)
    expected = {**stimulus["base_inputs"], **stimulus["derived_ratios"]}
    assert query.iloc[0].to_dict() == expected

    model = joblib.load(MODEL_PATH)
    preprocessor = joblib.load(PREPROCESSOR_PATH)
    threshold = float(stimulus["decision_threshold"])
    original_probability = float(model.predict_proba(preprocessor.transform(query))[0, 1])
    original_class = int(original_probability >= threshold)
    assert np.isclose(original_probability, 0.6519815921783447, atol=1e-10)
    assert original_class == 1 and threshold == 0.5

    _, train_raw, y_train, _ = modelling_data(modelling_features)
    continuous = train_raw.select_dtypes(include=np.number).columns.tolist()
    categorical = train_raw.select_dtypes(exclude=np.number).columns.tolist()
    permitted_ranges = {}
    training_iqr = {}
    for feature in FEATURES_TO_VARY:
        values = train_raw[feature].replace([np.inf, -np.inf], np.nan).dropna()
        lower, upper = values.quantile([0.01, 0.99]).astype(float)
        permitted_ranges[feature] = [max(0.0, lower), upper]
        training_iqr[feature] = float(values.quantile(0.75) - values.quantile(0.25))
    expected_ranges = {
        "AMT_CREDIT": [76410.0, 1862802.0],
        "AMT_ANNUITY": [6187.5, 70033.5],
        "AMT_GOODS_PRICE": [67500.0, 1800000.0],
    }
    for feature, expected_range in expected_ranges.items():
        assert np.allclose(permitted_ranges[feature], expected_range, atol=5.0)
    # Persist the exact training-derived values rather than the rounded prompt summary.

    dice_features = train_raw.copy()
    non_derived = [feature for feature in continuous if feature not in DERIVED_FEATURES]
    dice_features[non_derived] = dice_features[non_derived].fillna(train_raw[non_derived].median())
    dice_features[categorical] = dice_features[categorical].fillna(train_raw[categorical].mode(dropna=True).iloc[0])
    dice_features = recalculate_ratios(dice_features)
    dice_training = dice_features.copy()
    dice_training[TARGET] = y_train.to_numpy()
    wrapper = FrozenPipelineModel(preprocessor, model, modelling_features, threshold)
    data = dice_ml.Data(
        dataframe=dice_training, continuous_features=continuous,
        outcome_name=TARGET, permitted_range=permitted_ranges,
    )
    dice_model = dice_ml.Model(model=wrapper, backend="sklearn", model_type="classifier")
    explainer = dice_ml.Dice(data, dice_model, method="genetic")

    started_at = datetime.now(timezone.utc).isoformat()
    timer = time.perf_counter()
    try:
        outcome = Parallel(n_jobs=2, backend="loky", timeout=RETRY_TIMEOUT_SECONDS)(
            [delayed(guarded_search)(explainer, query, permitted_ranges)]
        )[0]
    except ProcessTimeoutError:
        outcome = {
            "generated": None,
            "error": "Counterfactual search timed out within the allocated computational budget.",
            "exception": "ProcessTimeoutError", "traceback": traceback.format_exc(),
        }
    except Exception as error:
        outcome = {
            "generated": None, "error": str(error),
            "exception": type(error).__name__, "traceback": traceback.format_exc(),
        }
    elapsed = time.perf_counter() - timer

    generated = outcome["generated"]
    retry_status = "technical_error"
    validation = {
        "independently_valid": False,
        "original_class": original_class,
        "desired_class": 0,
    }
    returned_count = 0 if generated is None else len(generated)
    participant_explanation = ""
    if generated is None or generated.empty:
        message = outcome["error"]
        if "No counterfactuals found" in message:
            retry_status = "no_counterfactual_returned_after_technical_retry"
        elif outcome["exception"] == "ProcessTimeoutError":
            retry_status = "timeout_after_technical_retry"
        else:
            retry_status = "technical_error"
    else:
        counterfactual = recalculate_ratios(
            generated.drop(columns=[TARGET], errors="ignore")[modelling_features].copy()
        ).iloc[[0]]
        cf_probability = float(model.predict_proba(preprocessor.transform(counterfactual))[0, 1])
        cf_class = int(cf_probability >= threshold)
        changed_direct = [
            feature for feature in FEATURES_TO_VARY
            if not np.isclose(float(query.iloc[0][feature]), float(counterfactual.iloc[0][feature]))
        ]
        unexpected_changes = [
            feature for feature in modelling_features
            if feature not in FEATURES_TO_VARY + DERIVED_FEATURES
            and not (
                (pd.isna(query.iloc[0][feature]) and pd.isna(counterfactual.iloc[0][feature]))
                or query.iloc[0][feature] == counterfactual.iloc[0][feature]
            )
        ]
        expected_ratios = recalculate_ratios(counterfactual).iloc[0][DERIVED_FEATURES]
        ratios_valid = bool(np.allclose(
            counterfactual.iloc[0][DERIVED_FEATURES].astype(float),
            expected_ratios.astype(float), atol=1e-9,
        ))
        ranges_valid = all(
            permitted_ranges[feature][0] <= float(counterfactual.iloc[0][feature]) <= permitted_ranges[feature][1]
            for feature in FEATURES_TO_VARY
        )
        proximity = float(sum(
            abs(float(counterfactual.iloc[0][feature]) - float(query.iloc[0][feature])) / training_iqr[feature]
            for feature in changed_direct
        ))
        valid = cf_class == 0 and not unexpected_changes and ranges_valid and ratios_valid
        validation.update({
            "counterfactual_probability": cf_probability,
            "counterfactual_class": cf_class,
            "only_permitted_direct_features_changed": not unexpected_changes,
            "changed_permitted_features": changed_direct,
            "changed_feature_count": len(changed_direct),
            "derived_ratios_consistent": ratios_valid,
            "permitted_ranges_respected": ranges_valid,
            "proximity": proximity,
            "independently_valid": valid,
        })
        if valid:
            retry_status = "success"
            complete = pd.concat([query.assign(record_type="original"), counterfactual.assign(record_type="counterfactual")])
            complete.insert(0, "case_id", CASE_ID)
            complete.to_csv(COUNTERFACTUAL_PATH, index=False)
            changes = []
            for feature in changed_direct:
                changes.append({
                    "case_id": CASE_ID, "feature": feature,
                    "display_feature": DISPLAY_NAMES[feature],
                    "original_value": float(query.iloc[0][feature]),
                    "counterfactual_value": float(counterfactual.iloc[0][feature]),
                    "absolute_change": float(counterfactual.iloc[0][feature] - query.iloc[0][feature]),
                })
            pd.DataFrame(changes).to_csv(CHANGES_PATH, index=False)
            participant_explanation = (
                "Under the model, an alternative combination of the loan-related values changes "
                "the prediction from higher risk to lower risk. This is a model explanation, not financial advice."
            )
        else:
            retry_status = "independent_validation_failed"

    shap_hashes_after = {path.name: sha256(path) for path in shap_paths}
    lime_hashes_after = {path.name: sha256(path) for path in lime_paths}
    hashes_after = frozen_hashes()
    assert hashes_before == hashes_after
    assert shap_hashes_before == shap_hashes_after
    assert lime_hashes_before == lime_hashes_after

    record = {
        "case_id": CASE_ID,
        "root_cause": (
            "DiCE genetic population deduplicated to one member; top_half became zero and "
            "the library called random.randrange(0)."
        ),
        "same_as_heloc_genetic_bug": True,
        "traceback_location": "dice_ml/explainer_interfaces/dice_genetic.py: random.randrange(top_half)",
        "technical_guard_used": "sole-parent safe randrange guard previously validated in HELOC Stage 07",
        "scientific_search_space_changed": False,
        "model_changed": False, "preprocessor_changed": False,
        "query_changed": False, "threshold_changed": False,
        "method": "genetic", "random_seed": RANDOM_STATE,
        "features_to_vary": FEATURES_TO_VARY,
        "permitted_ranges": permitted_ranges,
        "start_time": started_at, "elapsed_seconds": elapsed,
        "desired_class": 0, "counterfactuals_requested": 1,
        "counterfactuals_returned": returned_count,
        "status": retry_status,
        "exception_class": outcome["exception"],
        "error_message": outcome["error"],
        "traceback": outcome["traceback"],
        "original_probability": original_probability,
        "validation": validation,
        "participant_safe_explanation": participant_explanation,
        "shap_regenerated": False, "lime_regenerated": False,
        "lime_local_fidelity_r2": 0.16739826935386526,
        "lime_absolute_local_prediction_error": 0.13145229867583796,
        "shap_artifact_hashes_before": shap_hashes_before,
        "shap_artifact_hashes_after": shap_hashes_after,
        "lime_artifact_hashes_before": lime_hashes_before,
        "lime_artifact_hashes_after": lime_hashes_after,
    }
    RETRY_PATH.write_text(json.dumps(record, indent=2), encoding="utf-8")
    if retry_status == "success":
        STATUS_PATH.write_text(json.dumps({
            "case_id": CASE_ID, "method": "genetic", "status": "success",
            "source": "controlled_technical_retry", "independently_valid": True,
            "original_probability": original_probability,
            "counterfactual_probability": validation["counterfactual_probability"],
            "counterfactual_class": validation["counterfactual_class"],
            "participant_safe_explanation": participant_explanation,
        }, indent=2), encoding="utf-8")
    print(json.dumps(record, indent=2))


if __name__ == "__main__":
    main()
