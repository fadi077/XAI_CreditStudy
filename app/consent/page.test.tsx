import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ConsentPage from "@/app/consent/page";

const push = vi.fn(); const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));
beforeEach(() => { sessionStorage.clear(); push.mockClear(); replace.mockClear(); });

describe("consent-required flow", () => {
  it("guards consent until information has been viewed", () => {
    render(<ConsentPage />);
    expect(replace).toHaveBeenCalledWith("/information");
  });

  it("does not permit incomplete consent and stores only a temporary completed flag", () => {
    sessionStorage.setItem("informationViewed", "true");
    render(<ConsentPage />);
    const button = screen.getByRole("button", { name: "Continue" });
    expect(button).toBeDisabled();
    const checks = screen.getAllByRole("checkbox");
    checks.slice(0, -1).forEach(check => fireEvent.click(check));
    expect(button).toBeDisabled();
    fireEvent.click(checks.at(-1)!); fireEvent.click(button);
    expect(sessionStorage.getItem("consentCompleted")).toBe("true");
    expect(push).toHaveBeenCalledWith("/participant-code");
    expect(screen.queryByLabelText(/name|email|signature/i)).not.toBeInTheDocument();
  });
});
