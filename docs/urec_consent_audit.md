# UREC consent and information audit

This audit uses the Phase 3A specification available in the repository work session. The verbatim approved Participant Information Sheet and six-statement Consent Form were not supplied, so exact textual equivalence remains subject to project-lead or supervisor verification.

## Consent-page comparison

| approved_statement | represented_on_web_page | wording_equivalent | material_difference | recommended_action |
| --- | --- | --- | --- | --- |
| Participant Information Sheet has been read | Yes | Conceptually yes; verbatim check unavailable | Website says “participant information”, not the approved document title | Replace with exact approved wording only after the form is supplied |
| Questions understood and opportunity to ask questions | Partial | Cannot verify | “I understand what the study involves” does not expressly record an opportunity to ask questions | Confirm the approved statement and add it verbatim if required |
| Participation is voluntary | Yes | Conceptually yes; verbatim check unavailable | None identified at concept level | Verify against the approved form |
| Right to withdraw before questionnaire submission | Partial | No | Consent checkbox refers only to “withdrawal conditions”; the information page supplies the explicit limit | Put the approved withdrawal wording directly in the acknowledgement after verification |
| Anonymous responses cannot practically be withdrawn after submission | Partial | No | Explicit on information page but not in the checkbox text | Put the approved limitation directly in the acknowledgement after verification |
| Confidentiality/anonymity | Yes | Conceptually yes; verbatim check unavailable | “Anonymous research purposes” may not cover every approved confidentiality clause | Verify against the approved form |
| Agreement/wish to participate | Yes | Conceptually yes; verbatim check unavailable | Split across two website statements | Preserve or consolidate only as directed by the approved form |
| Secondary research-use consent, if present | Not represented | Cannot verify whether required | Approved wording was not supplied | Supervisor must confirm whether this clause exists and how it must be recorded |

The website page is a participant acknowledgement and navigation gate. Its `sessionStorage` flag is not formal consent evidence.

## Information-page comparison

| UREC topic | Current coverage | Audit result |
| --- | --- | --- |
| Study purpose | MSc study of understanding AI credit explanations and FCA Consumer Duty alignment | Covered |
| Researcher/student context | MSc context and named researcher contact | Covered |
| Participation activities | One fictional scenario, one explanation, approved questionnaire | Covered |
| Duration | Approximately 15–20 minutes | Covered |
| Voluntary participation | Expressly stated | Covered |
| Fictional/no personal decision | Expressly stated | Covered |
| No technical knowledge required | Expressly stated | Covered |
| Anonymity | No application collection of direct identifiers or demographics | Covered |
| Withdrawal | Before submission allowed; anonymous post-submission limitation stated | Covered |
| Secure storage | Secure approved university processes stated | Covered at summary level; verify exact UREC wording |
| Three-year retention | Not stated | Do not add until confirmed in the approved Information Sheet |
| Researcher/supervisor contact | Both contacts supplied | Covered |
| Ethics approval | University ethics approval stated | Covered; verify exact approved phrasing |

## Consent-role separation

- Website consent page: a participant-facing acknowledgement and navigation gate.
- Formal consent record: must follow the approved university procedure and is not currently created by the application.
- Microsoft Forms questionnaire: the intended research data-gathering instrument; its approved production URL is not configured.

## Formal-consent workflow options for review

### Option A — separate approved consent form

Formal consent is completed using the approved signed consent form before the researcher issues a randomly allocated P-code and study link.

- Advantages: preserves a clearly separate formal record and can satisfy a signature requirement where one applies.
- Risks: handling a signed form may introduce identifiable data and requires approved storage, access, retention and separation procedures.
- Changes required: no application change; document researcher allocation and consent-record handling outside the application.
- Signature issue: remains applicable and must follow the approved form and university procedure.

### Option B — mandatory Microsoft Forms consent items

The six approved statements appear as required items at the start of Microsoft Forms, but only if the project lead or supervisor confirms this is permitted by the approved ethics procedure.

- Advantages: one online flow, consistent required statements and a consent record associated with the questionnaire submission.
- Risks: may be a material deviation if approval requires a signed form; anonymity and withdrawal design must remain consistent; form metadata settings require review.
- Changes required: configure the approved statements and required responses in Microsoft Forms, verify settings, then configure `NEXT_PUBLIC_QUESTIONNAIRE_URL`.
- Signature issue: unresolved unless the supervisor confirms that mandatory electronic acknowledgement satisfies the approved requirement.

No institutional choice is made by this audit.

## Participant-code discrepancy

The supplied UREC description references both `P01–P10` and `P001–P010`. The application and backend currently use `P01–P10`. A single format should be confirmed by the supervisor across recruitment, consent, questionnaire and allocation records; `P01–P10` is the implementation-preserving recommendation unless the approved materials require otherwise.
