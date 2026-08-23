import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Scenario from "@/app/scenario/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/lib/study-session", () => ({ readStudySession: () => ({ code: "P01", method: "SHAP" }) }));

describe("Scenario", () => {
  it("renders exactly one approved fictional scenario and no-advice notice", () => {
    render(<Scenario />);
    expect(screen.getByRole("heading", { name: "Alex's application" })).toBeInTheDocument();
    expect(screen.getByText(/Alex is a 32-year-old applicant/)).toBeInTheDocument();
    expect(screen.getByText(/not financial advice/)).toBeInTheDocument();
    expect(screen.queryByText(/XAI_001|GER_XAI|HELOC_XAI/)).not.toBeInTheDocument();
  });
});
