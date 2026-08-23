import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ExplanationPage from "@/app/explanation/[code]/page";

const push = vi.fn();
let scenarioId = "study_scenario_01";
let assignedMethod = "SHAP";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  useParams: () => ({ code: scenarioId }),
}));
vi.mock("@/lib/study-session", () => ({
  readStudySession: () => ({ code: "P01", method: assignedMethod }),
}));

beforeEach(() => { push.mockClear(); scenarioId = "study_scenario_01"; assignedMethod = "SHAP"; });

describe("single participant explanation", () => {
  it("shows only the backend-assigned explanation method", () => {
    render(<ExplanationPage />);
    expect(screen.getByRole("heading", { name: "SHAP explanation" })).toBeInTheDocument();
    expect(screen.queryByText("LIME explanation")).not.toBeInTheDocument();
    expect(screen.queryByText("DiCE explanation")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("rejects a technical XAI case as a participant scenario", () => {
    scenarioId = "XAI_001";
    render(<ExplanationPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("not available");
  });

  it("continues directly from the single explanation to debrief", () => {
    assignedMethod = "DiCE";
    render(<ExplanationPage />);
    fireEvent.click(screen.getByRole("button", { name: /Continue to questionnaire transition/ }));
    expect(push).toHaveBeenCalledWith("/debrief");
  });
});
