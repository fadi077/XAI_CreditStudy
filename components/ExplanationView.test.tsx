import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExplanationView } from "@/components/ExplanationView";
import type { CaseExplanation } from "@/lib/api";

const explanation: CaseExplanation = {
  dataset_id: "heloc", case_id: "HELOC_XAI_006",
  prediction: { predicted_class: 1, predicted_probability: 0.6 },
  shap: { available: true, top_factors: [{ rank: 1, feature: "ExternalRiskEstimate", display_feature: "External risk estimate", display_value: 65, contribution: -0.4, direction: "towards lower risk", rule: null }] },
  lime: { available: true, local_fidelity_r2: 0.98, top_factors: [{ rank: 1, feature: "ExternalRiskEstimate", display_feature: "External risk estimate", display_value: 65, contribution: 0.3, direction: "towards higher risk", rule: "External risk estimate > 60" }] },
  dice: { available: true, final_status: "success", status_message: "valid", counterfactual_probability: 0.4, actionability_terminology: "counterfactual-modifiable financial-state variable", changes: [{ feature: "NetFractionRevolvingBurden", display_feature: "Net revolving burden", original_value: 70, counterfactual_value: 40 }] },
};

describe("ExplanationView", () => {
  it("renders the SHAP factors without other methods", () => {
    render(<ExplanationView explanation={explanation} method="SHAP" />);
    expect(screen.getByText("External risk estimate")).toBeInTheDocument();
    expect(screen.queryByText("Valid alternative found")).not.toBeInTheDocument();
  });

  it("renders LIME rules without researcher fidelity", () => {
    render(<ExplanationView explanation={explanation} method="LIME" />);
    expect(screen.getByText("External risk estimate > 60")).toBeInTheDocument();
    expect(screen.queryByText(/0.98/)).not.toBeInTheDocument();
  });

  it("renders a valid DiCE alternative", () => {
    render(<ExplanationView explanation={explanation} method="DiCE" />);
    expect(screen.getByText("Valid alternative found")).toBeInTheDocument();
    expect(screen.getByText("Net revolving burden")).toBeInTheDocument();
  });

  it("renders safe wording when DiCE is unavailable", () => {
    render(<ExplanationView explanation={{ ...explanation, dice: { ...explanation.dice, available: false, changes: [] } }} method="DiCE" />);
    expect(screen.getByText(/No valid alternative was returned/)).toBeInTheDocument();
  });
});
