import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import QuestionnairePage from "@/app/questionnaire/page";
import { QuestionnaireAction } from "@/components/QuestionnaireAction";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/lib/study-session", () => ({ readStudySession: () => ({ code: "P08", method: "DiCE" }), markQuestionnaireTransitionViewed: vi.fn() }));

describe("questionnaire transition", () => {
  it("keeps the code visible and does not invent a questionnaire URL", () => {
    render(<QuestionnairePage />);
    expect(screen.getByText("P08")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Questionnaire not yet available" })).toBeDisabled();
    expect(screen.getByText(/No personal information is sent automatically/)).toBeInTheDocument();
  });

  it("disables submission explicitly in non-participant pilot mode", () => {
    render(<QuestionnaireAction pilotMode questionnaireUrl="https://example.test/form" />);
    expect(screen.getByText(/submission is disabled in non-participant pilot mode/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Continue to questionnaire" })).not.toBeInTheDocument();
  });
});
