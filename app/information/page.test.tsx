import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InformationPage from "@/app/information/page";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
beforeEach(() => { sessionStorage.clear(); push.mockClear(); });

describe("participant information", () => {
  it("covers the approved concise information and records viewing locally", () => {
    render(<InformationPage />);
    expect(screen.getByText(/15–20 minutes/)).toBeInTheDocument();
    expect(screen.getByText(/cannot practically be identified and withdrawn/)).toBeInTheDocument();
    expect(screen.getByText(/does not collect names/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Continue to consent/ }));
    expect(sessionStorage.getItem("informationViewed")).toBe("true");
    expect(push).toHaveBeenCalledWith("/consent");
  });
});
