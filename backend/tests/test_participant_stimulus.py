import hashlib
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd


BACKEND = Path(__file__).resolve().parents[1]
ARTIFACTS = BACKEND / "artifacts"
STUDY = ARTIFACTS / "participant_study"
CASE_ID = "SYNTHETIC_ALEX_001"
BASE_FEATURES = [
    "NAME_CONTRACT_TYPE", "AMT_INCOME_TOTAL", "AMT_CREDIT", "AMT_ANNUITY",
    "AMT_GOODS_PRICE", "NAME_INCOME_TYPE", "NAME_HOUSING_TYPE",
    "CNT_FAM_MEMBERS", "AMT_REQ_CREDIT_BUREAU_MON",
    "AMT_REQ_CREDIT_BUREAU_QRT", "AMT_REQ_CREDIT_BUREAU_YEAR",
    "EMPLOYMENT_YEARS",
]
PERMITTED_DICE_FEATURES = {"AMT_CREDIT", "AMT_ANNUITY", "AMT_GOODS_PRICE"}


def load_json(name: str):
    return json.loads((STUDY / name).read_text(encoding="utf-8"))


def test_exact_synthetic_input_reconstructs_frozen_prediction():
    stimulus = load_json("stimulus.json")
    features = json.loads((ARTIFACTS / "primary_features.json").read_text(encoding="utf-8"))
    row = {**stimulus["base_inputs"], **stimulus["derived_ratios"]}
    frame = pd.DataFrame([row], columns=features)
    model = joblib.load(ARTIFACTS / "xgboost_credit_model.joblib")
    preprocessor = joblib.load(ARTIFACTS / "preprocessor.joblib")
    probability = float(model.predict_proba(preprocessor.transform(frame))[0, 1])
    assert np.isclose(probability, 0.6519815921783447, atol=1e-10)
    assert np.isclose(probability, stimulus["frozen_model_probability"], atol=1e-10)
    assert int(probability >= stimulus["decision_threshold"]) == 1


def test_all_methods_reference_the_same_synthetic_case():
    ids = {
        load_json("stimulus.json")["case_id"],
        load_json("shap_explanation.json")["case_id"],
        load_json("lime_explanation.json")["case_id"],
        load_json("dice_status.json")["case_id"],
    }
    assert ids == {CASE_ID}
    assert not CASE_ID.startswith(("XAI_", "GER_XAI_", "HELOC_XAI_"))


def test_synthetic_case_is_not_a_raw_or_evaluation_row():
    stimulus = load_json("stimulus.json")
    audit = stimulus["duplicate_audit"]
    assert audit["exact_raw_base_feature_matches"] == 0
    assert audit["exact_xai_evaluation_matches"] == 0
    assert audit["copied_from_existing_applicant"] is False
    assert len(stimulus["base_inputs"]) == 12
    assert all(stimulus["domain_validation"].values())


def test_shap_output_exists_and_is_additive():
    details = load_json("shap_explanation.json")
    factors = pd.read_csv(STUDY / "shap_top_factors.csv")
    assert len(factors) == 5 and factors["case_id"].eq(CASE_ID).all()
    assert details["maximum_additivity_difference"] < 1e-5
    assert details["probability_reconstruction_difference"] < 1e-5


def test_lime_output_records_fidelity_without_hiding_weakness():
    details = load_json("lime_explanation.json")
    factors = pd.read_csv(STUDY / "lime_top_factors.csv")
    assert len(factors) == 5 and factors["case_id"].eq(CASE_ID).all()
    assert isinstance(details["local_fidelity_r2"], float)
    assert isinstance(details["absolute_local_prediction_error"], float)
    assert np.isclose(details["local_fidelity_r2"], 0.16739826935386526)
    assert np.isclose(
        details["absolute_local_prediction_error"], 0.13145229867583796
    )


def test_dice_is_independently_valid_or_explicitly_unavailable():
    details = load_json("dice_status.json")
    assert details["status"] in {"success", "unavailable", "technical_error"}
    if details["status"] == "success":
        assert details["independently_valid"] is True
        assert details["counterfactual_class"] == 0
    else:
        assert details["independently_valid"] is False
        assert details["exception_class"] or details["error_message"]


def test_dice_technical_retry_preserves_explanations_and_search_space():
    retry = load_json("dice_technical_retry.json")
    assert retry["same_as_heloc_genetic_bug"] is True
    assert retry["scientific_search_space_changed"] is False
    assert retry["status"] == "success"
    assert retry["counterfactuals_returned"] == 1
    assert retry["shap_regenerated"] is False
    assert retry["lime_regenerated"] is False
    assert retry["shap_artifact_hashes_before"] == retry["shap_artifact_hashes_after"]
    assert retry["lime_artifact_hashes_before"] == retry["lime_artifact_hashes_after"]
    assert set(retry["features_to_vary"]) == PERMITTED_DICE_FEATURES
    assert np.isclose(retry["lime_local_fidelity_r2"], 0.16739826935386526)
    assert np.isclose(
        retry["lime_absolute_local_prediction_error"], 0.13145229867583796
    )


def test_dice_counterfactual_independently_flips_with_consistent_ratios():
    stimulus = load_json("stimulus.json")
    retry = load_json("dice_technical_retry.json")
    counterfactuals = pd.read_csv(STUDY / "dice_counterfactual.csv")
    changes = pd.read_csv(STUDY / "dice_feature_changes.csv")
    original = counterfactuals.loc[counterfactuals["record_type"].eq("original")].iloc[0]
    counterfactual = counterfactuals.loc[
        counterfactuals["record_type"].eq("counterfactual")
    ].iloc[0]

    assert counterfactuals["case_id"].eq(CASE_ID).all()
    assert set(changes["feature"]) == PERMITTED_DICE_FEATURES
    assert len(changes) == 3
    for feature in BASE_FEATURES:
        if feature not in PERMITTED_DICE_FEATURES:
            assert original[feature] == counterfactual[feature]

    assert np.isclose(
        counterfactual["CREDIT_INCOME_RATIO"],
        counterfactual["AMT_CREDIT"] / counterfactual["AMT_INCOME_TOTAL"],
    )
    assert np.isclose(
        counterfactual["ANNUITY_INCOME_RATIO"],
        counterfactual["AMT_ANNUITY"] / counterfactual["AMT_INCOME_TOTAL"],
    )
    assert np.isclose(
        counterfactual["CREDIT_ANNUITY_RATIO"],
        counterfactual["AMT_CREDIT"] / counterfactual["AMT_ANNUITY"],
    )

    features = json.loads((ARTIFACTS / "primary_features.json").read_text(encoding="utf-8"))
    frame = pd.DataFrame([counterfactual[features].to_dict()], columns=features)
    model = joblib.load(ARTIFACTS / "xgboost_credit_model.joblib")
    preprocessor = joblib.load(ARTIFACTS / "preprocessor.joblib")
    probability = float(model.predict_proba(preprocessor.transform(frame))[0, 1])
    assert np.isclose(probability, retry["validation"]["counterfactual_probability"])
    assert probability < stimulus["decision_threshold"]
    assert retry["validation"]["independently_valid"] is True
    assert retry["validation"]["derived_ratios_consistent"] is True
    assert retry["validation"]["permitted_ranges_respected"] is True


def test_canonical_labels_are_used_by_both_factor_methods():
    labels = load_json("canonical_display_labels.json")
    for filename in ("shap_top_factors.csv", "lime_top_factors.csv"):
        factors = pd.read_csv(STUDY / filename)
        expected = factors["original_feature"].map(labels)
        assert expected.equals(factors["display_feature"])


def test_frozen_research_hashes_are_unchanged():
    manifest = load_json("research_hash_manifest.json")
    for relative_path, expected_hash in manifest.items():
        path = BACKEND / relative_path
        actual_hash = hashlib.sha256(path.read_bytes()).hexdigest()
        assert actual_hash == expected_hash, relative_path
