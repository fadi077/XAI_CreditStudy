# Human-study protocol alignment

The participant study uses one fictional scenario and one assigned explanation. Home Credit is the source-model context; German Credit, HELOC, and the frozen XAI evaluation cases remain technical evidence only.

Participant codes retain the approved allocation: P01–P04 SHAP, P05–P07 LIME, and P08–P10 DiCE. The researcher randomly gives available codes to recruited participants; participants cannot select an explanation method.

The future route order reserves `/information` and `/consent` before `/scenario`. Consent evidence and questionnaire responses are not collected by the current application.

## Scenario/model compatibility

| Scenario field | Scenario value | Matching model feature | Match quality | Notes |
| --- | --- | --- | --- | --- |
| Age | 32 years | None | not represented | `DAYS_BIRTH` is not a final model input. |
| Loan amount | £8,000 | `AMT_CREDIT` | approximate | Conceptually related, but equivalence between pounds and dataset monetary units is not established. |
| Loan duration | 36 months | None | not represented | No final term/duration input; credit-to-annuity ratio is not a loan term. |
| Income | £24,000 per year | `AMT_INCOME_TOTAL` | approximate | Conceptually related, but monetary-unit equivalence is not established. |
| Employment duration | 14 months | `EMPLOYMENT_YEARS` | approximate | Related measure, but the model input was derived from employment days and is stored in years. |
| Existing credit accounts | 2 | None | not represented | Credit-bureau enquiry counts are not account counts. |
| Missed repayments | 2 in 18 months | None | not represented | No repayment-arrears input is in the final feature set. |

The scenario is classified **C — not faithfully representable without changing the approved scenario**. No prediction or SHAP/LIME/DiCE stimulus has been generated.

Scenario-unspecified final inputs are `NAME_CONTRACT_TYPE`, `AMT_ANNUITY`, `AMT_GOODS_PRICE`, `NAME_INCOME_TYPE`, `NAME_HOUSING_TYPE`, `CNT_FAM_MEMBERS`, `AMT_REQ_CREDIT_BUREAU_MON`, `AMT_REQ_CREDIT_BUREAU_QRT`, and `AMT_REQ_CREDIT_BUREAU_YEAR`. The model also requires `CREDIT_INCOME_RATIO`, `ANNUITY_INCOME_RATIO`, and `CREDIT_ANNUITY_RATIO`; these are derived inputs whose source values are incomplete or not yet validated for the scenario.
