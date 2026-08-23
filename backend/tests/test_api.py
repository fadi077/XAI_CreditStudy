from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_root() -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"service": "XAI CreditStudy API", "status": "running", "version": "1.0.0"}


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "datasets": 3, "artifact_registry_loaded": True}


def test_dataset_list() -> None:
    response = client.get("/api/datasets")
    assert response.status_code == 200
    body = response.json()
    assert [item["dataset_id"] for item in body] == ["home_credit", "german_credit", "heloc"]
    assert all(item["xai_case_count"] == 20 for item in body)
    assert all("artifact_directory" not in item for item in body)


def test_dataset_details() -> None:
    expected = {
        "home_credit": ("Weighted XGBoost", 61503, 8),
        "german_credit": ("Weighted XGBoost", 200, 12),
        "heloc": ("Baseline XGBoost", 1974, 8),
    }
    for dataset_id, values in expected.items():
        response = client.get(f"/api/datasets/{dataset_id}")
        assert response.status_code == 200
        body = response.json()
        assert (body["model_type"], body["test_rows"], body["valid_dice_counterfactual_count"]) == values
        assert body["decision_threshold"] == 0.5
        assert body["metrics"]["roc_auc"] is not None


def test_home_credit_feature_provenance_note() -> None:
    body = client.get("/api/datasets/home_credit").json()
    assert body["base_features"] == 12
    assert body["engineered_features"] == 3
    assert body["modelling_inputs"] == 15
    assert "provenance" in body["provenance_note"].lower()


def test_participant_assignments() -> None:
    for code, method in (("P01", "SHAP"), ("P05", "LIME"), ("P08", "DiCE")):
        response = client.get(f"/api/study/participants/{code}")
        assert response.status_code == 200
        assert response.json() == {"participant_code": code, "assigned_method": method}


def test_invalid_participant_code() -> None:
    response = client.get("/api/study/participants/P11")
    assert response.status_code == 404
    assert response.json()["detail"] == "Invalid participant code."


def test_study_case_list_is_participant_safe() -> None:
    response = client.get("/api/study/german_credit/cases")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 20
    assert set(body[0]) == {"case_id", "predicted_class", "predicted_probability", "case_type"}
    assert "true_target" not in body[0] and "row_index" not in body[0]


def test_valid_explanation_response() -> None:
    response = client.get("/api/study/heloc/cases/HELOC_XAI_006/explanations")
    assert response.status_code == 200
    body = response.json()
    assert len(body["shap"]["top_factors"]) == 5
    assert len(body["lime"]["top_factors"]) == 5
    assert body["lime"]["local_fidelity_r2"] is not None
    assert body["dice"]["available"] is True
    assert body["dice"]["actionability_terminology"] == "counterfactual-modifiable financial-state variable"


def test_unknown_dataset() -> None:
    assert client.get("/api/datasets/unknown").status_code == 404
    assert client.get("/api/study/unknown/cases").status_code == 404


def test_unknown_case() -> None:
    response = client.get("/api/study/heloc/cases/UNKNOWN/explanations")
    assert response.status_code == 404
    assert response.json()["detail"] == "Unknown study case identifier."


def test_dice_unavailable_has_safe_wording() -> None:
    response = client.get("/api/study/heloc/cases/HELOC_XAI_001/explanations")
    assert response.status_code == 200
    dice = response.json()["dice"]
    assert dice["available"] is False
    assert dice["changes"] == []
    assert dice["status_message"] == "No valid counterfactual returned under the configured search constraints."
    assert "no counterfactual exists" not in dice["status_message"].lower()


def test_heloc_special_code_text_is_preserved() -> None:
    response = client.get("/api/study/heloc/cases/HELOC_XAI_011/explanations")
    assert response.status_code == 200
    values = [factor["display_value"] for factor in response.json()["shap"]["top_factors"]]
    assert "special code -8" in values


def test_cors_allows_only_configured_frontend() -> None:
    allowed = client.options("/api/datasets", headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"})
    assert allowed.status_code == 200
    assert allowed.headers["access-control-allow-origin"] == "http://localhost:3000"
    denied = client.options("/api/datasets", headers={"Origin": "https://untrusted.example", "Access-Control-Request-Method": "GET"})
    assert "access-control-allow-origin" not in denied.headers
