import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Debrief from "@/app/debrief/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/lib/study-session", () => ({ readStudySession: () => ({ code: "P01", method: "SHAP" }), hasViewedQuestionnaireTransition: () => true }));

describe("debrief", () => {
  it("explains the comparison, fictional scenario, anonymity and aggregate reporting", () => {
    render(<Debrief />);
    expect(screen.getByRole("heading", { name: /Thank you/ })).toBeInTheDocument();
    expect(screen.getByText(/compares SHAP, LIME and DiCE/)).toBeInTheDocument();
    expect(screen.getByText(/entirely fictional/)).toBeInTheDocument();
    expect(screen.getByText(/reported in aggregate/)).toBeInTheDocument();
  });
});
