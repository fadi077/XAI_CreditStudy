# Frontend manual test record

Phase 3 participant-study integration was checked locally against the persisted `SYNTHETIC_ALEX_001` artifacts. No questionnaire response was submitted.

| Area | Evidence | Result |
| --- | --- | --- |
| Information | Purpose, 15–20 minute duration, fictional scenario, voluntary participation, anonymity, withdrawal limits, university handling, contacts and ethics wording displayed | Pass |
| Consent | Six positive acknowledgements required; incomplete consent kept Continue disabled; no name, signature or email field | Pass |
| Participant allocation | P99 rejected; P01/P05/P08 accepted through backend-authoritative allocation; no method selector | Pass |
| Same-scenario control | P01, P05 and P08 scenario text compared identically; each displayed `Application rejected` | Pass |
| SHAP | P01 displayed SHAP factors only, with readable labels and directions | Pass |
| LIME | P05 displayed LIME rules only; research-only fidelity diagnostics were absent | Pass |
| DiCE | P08 displayed only requested credit, annuity and goods-price original/alternative values plus the non-advice notice | Pass |
| Questionnaire transition | Participant code remained visible; configured test URL was used from the environment; no personal information was transmitted | Pass |
| Questionnaire unavailable | With the environment variable absent, a disabled `Questionnaire not yet available` control appeared | Pass |
| Debrief | Thank-you, three-method comparison, fictional scenario, anonymity, aggregate reporting and contacts displayed | Pass |
| Navigation | Fresh direct explanation navigation redirected to `/information`; refresh retained a valid session | Pass |
| Privacy | No names, emails, demographics, financial details, login, analytics, tracking or participant database were introduced | Pass |
| Responsive rendering | 375×812 and 1440×900 viewports displayed the explanation with no horizontal overflow | Pass |

## Operational controls

The researcher must randomly allocate available codes: P01–P04 assign SHAP, P05–P07 assign LIME, and P08–P10 assign DiCE. Participants must not choose their code or explanation method.

The application stores only `informationViewed`, `consentCompleted`, `participantCode`, `assignedMethod`, and `questionnaireTransitionViewed` in `sessionStorage`. These values are navigation controls, not research evidence, and clearing the session restarts the study.

## Pre-pilot confirmation required

The repository does not contain the full approved UREC materials or establish whether the approved Microsoft Forms questionnaire stores the formal consent record. The project lead must confirm the formal consent-record location and verify the displayed information/consent summary against the approved documents before live participant use.
