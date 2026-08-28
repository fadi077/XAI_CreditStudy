# Non-participant pilot checklist

Set `NEXT_PUBLIC_PILOT_MODE=true`. Do not configure or submit a live questionnaire during the pilot. Use P01, P05 and P08 only as project-lead test journeys; these checks are not participant sessions and collect no research data.

- [ ] Pilot banner is visible on every route.
- [ ] Information page matches the approved Participant Information Sheet.
- [ ] All consent acknowledgements are required before continuing.
- [ ] Consent wording is verified against all six approved statements.
- [ ] P01, P05 and P08 are accepted; an invalid code is rejected.
- [ ] The Alex scenario wording is identical for all three codes.
- [ ] `Application rejected` is identical for all three codes.
- [ ] P01 displays SHAP and no LIME/DiCE content.
- [ ] P05 displays LIME and no SHAP/DiCE content.
- [ ] P08 displays DiCE and no SHAP/LIME content.
- [ ] No technical probability, fidelity metric, traceback, raw feature name or dataset row is exposed.
- [ ] Questionnaire transition keeps the participant code visible.
- [ ] Pilot mode disables questionnaire submission even if a URL exists.
- [ ] Debrief covers method comparison, fictionality, anonymity, aggregate reporting and contacts.
- [ ] Mobile layout has readable controls and no horizontal overflow.
- [ ] Desktop layout remains balanced across explanation methods.
- [ ] Keyboard-only navigation follows a logical order with visible focus.
- [ ] No names, emails, demographics, financial data, analytics, cookies or database records are collected.
- [ ] Clearing `sessionStorage` restarts the study flow.

Record defects without entering or submitting a real research response.
