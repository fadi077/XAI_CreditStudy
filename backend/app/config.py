from dataclasses import dataclass
from pathlib import Path
import os


BACKEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_ROOT.parent
ARTIFACTS_ROOT = BACKEND_ROOT / "artifacts"
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")


@dataclass(frozen=True)
class DatasetArtifacts:
    dataset_id: str
    display_name: str
    artifact_directory: Path
    xai_case_file: str = "xai_evaluation_cases.csv"
    model_metadata_file: str = "model_metadata.json"
    evaluation_metadata_file: str = "xai_evaluation_metadata.json"
    stage08_summary_file: str = "xai_evaluation_summary.csv"


DATASET_REGISTRY = {
    "home_credit": DatasetArtifacts(
        dataset_id="home_credit",
        display_name="Home Credit",
        artifact_directory=ARTIFACTS_ROOT,
    ),
    "german_credit": DatasetArtifacts(
        dataset_id="german_credit",
        display_name="German Credit",
        artifact_directory=ARTIFACTS_ROOT / "german_credit",
    ),
    "heloc": DatasetArtifacts(
        dataset_id="heloc",
        display_name="HELOC",
        artifact_directory=ARTIFACTS_ROOT / "heloc",
    ),
}

