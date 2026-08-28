import type { ExplanationMethod, ParticipantStimulus } from "@/lib/api";

export function participantStimulus(method: ExplanationMethod): ParticipantStimulus {
  return {
    participant_code: method === "SHAP" ? "P01" : method === "LIME" ? "P05" : "P08",
    case_id: "SYNTHETIC_ALEX_001",
    assigned_method: method,
    scenario: {
      title: "Fictional Research Scenario",
      paragraphs: [
        "Alex is a working applicant who rents their home and has been in their current employment for 1.5 years.",
        "Alex has applied for a cash loan of 600,000 for goods priced at 500,000. Their recorded annual income is 180,000, and the loan annuity amount is 30,000. Financial amounts in this fictional example are shown using the dataset’s recorded units rather than a real-world currency.",
        "Alex’s household has three family members. Credit-bureau records show no enquiries in the previous month, one enquiry in the previous quarter, and four enquiries in the previous year.",
        "After assessing this information, the AI system classified the application as higher risk.",
        "AI decision: Application rejected.",
      ],
      notice: "This is a fictional research example. It does not represent a real applicant and is not financial advice.",
    },
    prediction: { decision: "Application rejected" },
    explanation: method === "DiCE" ? {
      method, introduction: "Under the model, this alternative combination of loan-related values changes the predicted decision.", factors: [],
      changes: [{ label: "Requested credit amount", original_value: 600000, alternative_value: 76410 }, { label: "Annuity amount", original_value: 30000, alternative_value: 6187.5 }, { label: "Goods price", original_value: 500000, alternative_value: 67500 }],
      notice: "This is a model-based alternative, not financial advice or a guaranteed real-world outcome.",
    } : {
      method, introduction: "These factors contributed most strongly to the AI model's decision.",
      factors: method === "SHAP" ? [
        { rank: 1, label: "Employment duration", value: 1.5, direction: "increases the model's higher-risk prediction" },
        { rank: 2, label: "Housing type", value: "Rented apartment", direction: "increases the model's higher-risk prediction" },
        { rank: 3, label: "Credit enquiries in previous quarter", value: 1, direction: "decreases the model's higher-risk prediction" },
        { rank: 4, label: "Income type", value: "Working", direction: "increases the model's higher-risk prediction" },
        { rank: 5, label: "Credit-to-annuity ratio", value: 20, direction: "increases the model's higher-risk prediction" },
      ] : [
        { rank: 1, label: "Contract type: Cash loans", value: "Cash loans", direction: "increases the local higher-risk prediction" },
        { rank: 2, label: "Employment duration <= 2.55 years", value: 1.5, direction: "increases the local higher-risk prediction" },
        { rank: 3, label: "Income type: Working", value: "Working", direction: "increases the local higher-risk prediction" },
        { rank: 4, label: "Credit enquiries in previous quarter > 0.00", value: 1, direction: "decreases the local higher-risk prediction" },
        { rank: 5, label: "24903.00 < Annuity amount <= 34596.00", value: 30000, direction: "increases the local higher-risk prediction" },
      ], changes: [], notice: "These are model associations, not causes or guarantees.",
    },
  };
}
