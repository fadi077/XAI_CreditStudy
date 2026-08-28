import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ExplanationPage from "@/app/explanation/[code]/page";
import { getParticipantStimulus, type ExplanationMethod } from "@/lib/api";
import { participantStimulus } from "@/test-utils/participant-stimulus";

const replace = vi.fn();
let code = "P01"; let method: ExplanationMethod = "SHAP"; let scenario = "SYNTHETIC_ALEX_001"; let sessionAvailable = true;
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace }), useParams: () => ({ code: scenario }) }));
vi.mock("@/lib/api", async importOriginal => ({ ...(await importOriginal<typeof import("@/lib/api")>()), getParticipantStimulus: vi.fn() }));
vi.mock("@/lib/study-session", () => ({ readStudySession: () => sessionAvailable ? ({ code, method }) : null }));
beforeEach(() => { vi.clearAllMocks(); code = "P01"; method = "SHAP"; scenario = "SYNTHETIC_ALEX_001"; sessionAvailable = true; });

describe("assigned participant explanation", () => {
  it.each([["P01", "SHAP"], ["P05", "LIME"], ["P08", "DiCE"]] as const)("%s receives only %s", async (participantCode, assigned) => {
    code = participantCode; method = assigned; vi.mocked(getParticipantStimulus).mockResolvedValue(participantStimulus(assigned));
    render(<ExplanationPage />);
    const expectedHeading = assigned === "DiCE" ? "Understanding the decision" : "Why did the system reject Alex's application?";
    expect(await screen.findByRole("heading", { name: expectedHeading })).toBeInTheDocument();
    expect(screen.getByText("Application rejected")).toBeInTheDocument();
    expect(screen.getByText(assigned === "DiCE" ? "Application decision" : "System decision")).toBeInTheDocument();
    for (const other of ["SHAP", "LIME", "DiCE"].filter(value => value !== assigned)) expect(screen.queryByRole("heading", { name: `${other} explanation` })).not.toBeInTheDocument();
  });

  it("shows the simplified five-factor SHAP explanation without technical jargon", async () => {
    vi.mocked(getParticipantStimulus).mockResolvedValue(participantStimulus("SHAP"));
    render(<ExplanationPage />);
    expect(await screen.findByRole("heading", { name: "Why did the system reject Alex's application?" })).toBeInTheDocument();
    expect(screen.getByText("The system looked at different information about Alex. These were the five most important factors in its decision.")).toBeInTheDocument();
    const factors = screen.getAllByTestId("shap-factor");
    expect(factors).toHaveLength(5);
    expect(factors.map(factor => factor.textContent)).toEqual([
      expect.stringContaining("1Employment1.5 yearsSupported rejection"),
      expect.stringContaining("2HousingRented apartmentSupported rejection"),
      expect.stringContaining("3Credit enquiries1 in the last 3 monthsSupported approval"),
      expect.stringContaining("4Income typeWorkingSupported rejection"),
      expect.stringContaining("5Loan-to-annuity comparison20Supported rejection"),
    ]);
    expect(screen.getByRole("heading", { name: "Simple explanation" })).toBeInTheDocument();
    expect(screen.getByText("Most of these factors made the system more likely to reject Alex's application. Alex's credit enquiries worked in their favour, but the other important factors had a stronger effect. Overall, the system decided to reject the application.")).toBeInTheDocument();
    expect(screen.getByText("This explanation shows which factors were important to the system's decision. It does not mean that any one factor alone caused the rejection.")).toBeInTheDocument();
    const participantText = screen.getByRole("heading", { name: "Why did the system reject Alex's application?" }).closest("section")?.textContent ?? "";
    expect(participantText).not.toMatch(/Shapley|feature attribution|contribution score|log odds|base value|XGBoost|additivity|AMT_|SHAP value/i);
    expect(participantText).not.toContain("LIME explanation");
    expect(participantText).not.toContain("DiCE explanation");
  });

  it("shows actual Alex values in a simplified five-factor LIME explanation", async () => {
    code = "P05"; method = "LIME";
    vi.mocked(getParticipantStimulus).mockResolvedValue(participantStimulus("LIME"));
    render(<ExplanationPage />);
    expect(await screen.findByRole("heading", { name: "Why did the system reject Alex's application?" })).toBeInTheDocument();
    expect(screen.getByText("The explanation highlights the following information from Alex's application.")).toBeInTheDocument();
    const factors = screen.getAllByTestId("lime-factor");
    expect(factors).toHaveLength(5);
    expect(factors.map(factor => factor.textContent)).toEqual([
      expect.stringContaining("1Loan typeCash loanSupported rejection"),
      expect.stringContaining("2Employment1.5 yearsSupported rejection"),
      expect.stringContaining("3Source of incomeEmploymentSupported rejection"),
      expect.stringContaining("4Credit enquiries1 in the previous quarterSupported approval"),
      expect.stringContaining("5Annuity amount30,000Supported rejection"),
    ]);
    expect(screen.getByRole("heading", { name: "What does this explanation mean?" })).toBeInTheDocument();
    expect(screen.getByText("For Alex's application, the system considered several important details. Alex applied for a cash loan, had been employed for 1.5 years, had employment as their source of income, and had an annuity amount of 30,000. These factors supported rejection in this explanation. Alex also had 1 credit enquiry in the previous quarter, which supported approval. When these factors were considered together, the system rejected Alex's application.")).toBeInTheDocument();
    expect(screen.getByText("These factors should be considered together. No single factor on its own means that an application will be approved or rejected.")).toBeInTheDocument();
    const participantText = screen.getByRole("heading", { name: "Why did the system reject Alex's application?" }).closest("section")?.textContent ?? "";
    expect(participantText).not.toMatch(/LIME|surrogate|local approximation|feature weight|fidelity|prediction error|intercept|num_samples|random state|<=|>=|<|>|0\.167398|0\.131452|NAME_|AMT_/i);
    expect(participantText).not.toContain("Simple explanation");
    expect(participantText).not.toContain("DiCE explanation");
  });

  it("shows the validated DiCE changes as a plain application comparison", async () => {
    code = "P08"; method = "DiCE";
    vi.mocked(getParticipantStimulus).mockResolvedValue(participantStimulus("DiCE"));
    render(<ExplanationPage />);
    expect(await screen.findByRole("heading", { name: "Understanding the decision" })).toBeInTheDocument();
    expect(screen.getByText("Application rejected")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What could have changed the decision?" })).toBeInTheDocument();
    expect(screen.getByText("The application was assessed using the information provided. The following combination of loan details would have resulted in a different decision:")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Application detail" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Alex's application" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Details that would change the decision" })).toBeInTheDocument();
    const rows = screen.getAllByTestId("dice-change");
    expect(rows).toHaveLength(3);
    expect(screen.getAllByTestId("dice-mobile-change")).toHaveLength(3);
    expect(rows.map(row => row.textContent)).toEqual([
      "Requested credit amount600,00076,410",
      "Annuity amount30,0006,187.50",
      "Goods price500,00067,500",
    ]);
    expect(screen.getByRole("heading", { name: "Result with these changes" })).toBeInTheDocument();
    expect(screen.getByText("Application approved")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What does this mean?" })).toBeInTheDocument();
    expect(screen.getByText("Alex's application included a requested credit amount of 600,000, an annuity amount of 30,000, and goods priced at 500,000. Based on these and the other information provided, the application was rejected.")).toBeInTheDocument();
    expect(screen.getByText("If the requested credit amount had been 76,410, the annuity amount 6,187.50, and the goods price 67,500, while all other information remained the same, the application would have been approved.")).toBeInTheDocument();
    expect(screen.getByText("These three amounts are considered together. This does not mean that changing just one of them would result in approval. It shows how different application details could have changed the system's decision.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Important information" })).toBeInTheDocument();
    expect(screen.getByText("This explanation is provided to help you understand the decision. It is not financial advice and does not guarantee the outcome of another application.")).toBeInTheDocument();
    const participantText = screen.getByRole("heading", { name: "Understanding the decision" }).closest("section")?.textContent ?? "";
    expect(participantText).not.toMatch(/DiCE|counterfactual|model-based alternative|higher-risk|lower-risk|probability|class [01]|proximity|genetic|permitted range|threshold|AMT_|SYNTHETIC_ALEX|retry/i);
    expect(participantText).not.toContain("Alternative value");
    expect(participantText).not.toContain("SHAP");
    expect(participantText).not.toContain("LIME");
    expect(screen.getByRole("button", { name: /Continue to questionnaire transition/ })).toHaveClass("focus:ring-2");
  });

  it("rejects technical evaluation case identifiers", async () => {
    scenario = "XAI_001"; render(<ExplanationPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("not available");
    expect(getParticipantStimulus).not.toHaveBeenCalled();
  });

  it("guards direct navigation without the completed session", () => {
    sessionAvailable = false; render(<ExplanationPage />);
    expect(replace).toHaveBeenCalledWith("/information");
  });
});
