# XAI CreditStudy

This repository contains my MSc Data Science and Artificial Intelligence project comparing SHAP, LIME and DiCE explanations for automated credit-risk decisions. The technical comparison uses Home Credit, German Credit and HELOC. The participant study uses one separate fictional case that is compatible with the frozen Home Credit model.

## Reported implementation version

- Deployed frontend: https://xai-credit-study.vercel.app/
- Deployed backend: https://xai-creditstudy.onrender.com/

## Repository structure

- `app/` — Next.js participant-study pages
- `components/` and `lib/` — shared frontend components, API client and study-session logic
- `backend/app/` — FastAPI application and read-only research-artifact API
- `backend/ml/` — Stage 01–08 notebooks for the three datasets
- `backend/artifacts/` — frozen models, preprocessors, evaluation cases, explanations, metrics and provenance records
- `backend/tests/` — backend automated tests

## Local setup

The project was developed on Windows. Python 3.10 was used for the frozen research environment.

### Frontend

Install the exact frontend dependencies recorded in `package-lock.json`:

```powershell
npm ci
```

Create `.env.local` and set the local backend address:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Start the frontend:

```powershell
npm run dev
```

The frontend is then available at `http://localhost:3000`.

### Backend API

Create the local environment if `backend/.venv` is not already available:

```powershell
py -3.10 -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

Start FastAPI from the repository root:

```powershell
backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload
```

The API is then available at `http://localhost:8000`, with its health endpoint at `http://localhost:8000/health`. The root `requirements.txt` records the larger ML/notebook environment and is not required merely to run the deployed read-only API.

## Verification commands

Run the frontend tests, TypeScript check and production build from the repository root:

```powershell
npm test
npm run typecheck
npm run build
```

Run the backend tests with:

```powershell
backend\.venv\Scripts\python.exe -m pytest backend\tests
```

The final verification reported in the dissertation was 29/29 frontend tests and 26/26 backend tests, together with a successful TypeScript check and production build. The automated test implementations are stored in the frontend `*.test.ts` and `*.test.tsx` files and in `backend/tests/`. Manual responsive, navigation and privacy checks are reported in the dissertation testing evidence.

## Dependency records

Exact frontend versions are locked in `package-lock.json`. Principal versions include Next.js 14.2.35, React 18.3.1, React DOM 18.3.1, TypeScript 5.9.3 and Vitest 2.1.9.

`backend/requirements.txt` contains the pinned API deployment environment. The root `requirements.txt` records the ML research environment, including XGBoost 3.2.0, SHAP 0.49.1, LIME 0.2.0.1, scikit-learn 1.7.2, pandas 2.3.3 and NumPy 2.2.6.

## Results and implementation evidence

The principal persisted comparison summaries are:

- `backend/artifacts/xai_evaluation_summary.csv` — Home Credit
- `backend/artifacts/german_credit/xai_evaluation_summary.csv` — German Credit
- `backend/artifacts/heloc/xai_evaluation_summary.csv` — HELOC
- `backend/artifacts/model_metadata.json` and the dataset-specific equivalents — frozen model configuration and holdout results
- `backend/artifacts/participant_study/` — frozen synthetic case and participant-facing explanation content

The corresponding Stage 03–08 notebooks record preprocessing, model training, SHAP, LIME, DiCE and final XAI evaluation. Persisted artefacts are used by the deployed API; the application does not retrain models or regenerate explanations at request time.

## Dataset provenance and use terms

### Home Credit Default Risk

- Source: https://www.kaggle.com/competitions/home-credit-default-risk/data
- File used: `application_train.csv`
- Snapshot size: 307,511 rows and 122 columns
- SHA-256: `52e96b895b1112e1c853f670e58372719c8441c5ed1c57ac2f7fad559d784f5f`
- Use terms: access and reuse are subject to the Kaggle competition rules and Kaggle terms.

The original acquisition date and an official release identifier were not preserved in a dedicated provenance record. The hash identifies the exact local file used, but this remaining provenance gap is disclosed in the dissertation risk register and limitations.

### Statlog German Credit

- Source: https://archive.ics.uci.edu/dataset/144/statlog+german+credit+data
- UCI dataset ID: 144
- DOI: https://doi.org/10.24432/C5NC77
- Snapshot: 1,000 rows and 20 predictors
- Retrieved: 21 August 2026 using `ucimlrepo.fetch_ucirepo(id=144)`
- SHA-256: `f985b42636c9e28ce4fb3913738d1ebfd0f7947fda8d4406fe2ded5d84295acb`
- Licence: Creative Commons Attribution 4.0 International (CC BY 4.0)
- Evidence: `backend/artifacts/german_credit/dataset_provenance.json`

### HELOC

- Source: https://huggingface.co/datasets/mstz/heloc
- Dataset/configuration: `mstz/heloc`, `risk`
- Saved source revision: `4bd259f3d6a5a8d2b4f4168ac93d330c21a4c73b`
- Snapshot: 10,459 rows and 24 columns, including 23 predictors and the target
- Retrieved: 22 August 2026
- SHA-256: `786b7e1885cf508ef66a968aae65a72bfde198d06d7666ac582958705b092570`
- Evidence: `backend/artifacts/heloc/dataset_provenance.json`
