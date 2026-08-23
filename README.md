# XAI CreditStudy

MSc research project comparing SHAP, LIME, and DiCE explanations across Home Credit, German Credit, and HELOC credit-risk datasets.

## Structure

- `app/` — Next.js participant-study frontend
- `backend/app/` — FastAPI read-only research-artifact API
- `backend/ml/` — frozen Stage 01–08 research notebooks
- `backend/artifacts/` — persisted models, metadata, explanations, and evaluation outputs

## Local development

Backend:

```powershell
backend\.venv\Scripts\uvicorn.exe app.main:app --app-dir backend --reload
```

Frontend:

```powershell
npm install
npm run dev
```

Raw dataset snapshots are excluded from Git. Dataset sources, hashes, and provenance are recorded in the persisted research artifacts.
