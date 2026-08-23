# Frontend manual test record

Phase 2A protocol-alignment checks. Final synthetic explanations remain disabled pending research validation.

| Test case | Expected result | Actual result | Result |
| --- | --- | --- | --- |
| P01 | Backend assigns SHAP; no method selector appears | SHAP validation-pending view displayed | Pass |
| P05 | Backend assigns LIME; no method selector appears | LIME validation-pending view displayed | Pass |
| P08 | Backend assigns DiCE; no method selector appears | DiCE validation-pending view displayed | Pass |
| Invalid P99 | Participant-friendly validation message | Validation message displayed; no navigation | Pass |
| Backend stopped | Participant-friendly unavailable message | Unavailable message displayed without technical detail | Pass |
| Approved scenario | One fictional Alex scenario appears | Exact approved factual scenario displayed | Pass |
| Technical case ID | Frozen case cannot be used as participant stimulus | `XAI_001` route rejected | Pass |
| Single explanation | One explanation leads directly to transition | Continued directly to debrief | Pass |
| Questionnaire unset | No broken external link | Disabled configuration-driven button displayed | Pass |

Final synthetic input values and explanations require approval before participant use.
