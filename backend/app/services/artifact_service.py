import csv
import json
import math
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.config import DATASET_REGISTRY, DatasetArtifacts


class ArtifactError(RuntimeError):
    def __init__(self, message: str, *, missing: bool = False):
        super().__init__(message)
        self.missing = missing


class ArtifactService:
    def dataset(self, dataset_id: str) -> DatasetArtifacts:
        dataset = DATASET_REGISTRY.get(dataset_id)
        if dataset is None:
            raise KeyError(dataset_id)
        return dataset

    @staticmethod
    @lru_cache(maxsize=128)
    def _read_csv(path: Path) -> tuple[dict[str, str], ...]:
        if not path.is_file():
            raise ArtifactError("Required persisted artifact is unavailable.", missing=True)
        try:
            with path.open(encoding="utf-8-sig", newline="") as handle:
                reader = csv.DictReader(handle)
                if not reader.fieldnames:
                    raise ArtifactError("Persisted artifact is malformed.")
                return tuple(dict(row) for row in reader)
        except ArtifactError:
            raise
        except (OSError, csv.Error, UnicodeError) as exc:
            raise ArtifactError("Persisted artifact could not be read.") from exc

    @staticmethod
    @lru_cache(maxsize=32)
    def _read_json(path: Path) -> dict[str, Any]:
        if not path.is_file():
            raise ArtifactError("Required persisted artifact is unavailable.", missing=True)
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError) as exc:
            raise ArtifactError("Persisted artifact is malformed.") from exc
        if not isinstance(value, dict):
            raise ArtifactError("Persisted artifact is malformed.")
        return value

    def csv(self, dataset_id: str, filename: str) -> tuple[dict[str, str], ...]:
        return self._read_csv(self.dataset(dataset_id).artifact_directory / filename)

    def json(self, dataset_id: str, filename: str) -> dict[str, Any]:
        return self._read_json(self.dataset(dataset_id).artifact_directory / filename)

    def registry_available(self) -> bool:
        return all(
            (entry.artifact_directory / entry.xai_case_file).is_file()
            and (entry.artifact_directory / entry.model_metadata_file).is_file()
            for entry in DATASET_REGISTRY.values()
        )

    @staticmethod
    def number(value: Any) -> float | None:
        if value in (None, ""):
            return None
        try:
            result = float(value)
        except (TypeError, ValueError):
            return None
        return result if math.isfinite(result) else None

    @classmethod
    def integer(cls, value: Any) -> int | None:
        number = cls.number(value)
        return int(number) if number is not None else None

    @staticmethod
    def boolean(value: Any) -> bool:
        return str(value).strip().lower() in {"true", "1", "yes"}

    @classmethod
    def display_value(cls, value: Any) -> str | int | float | None:
        if value in (None, ""):
            return None
        text = str(value)
        if text.lower().startswith("special code"):
            return text
        number = cls.number(text)
        if number is None:
            return text
        return int(number) if number.is_integer() else number

