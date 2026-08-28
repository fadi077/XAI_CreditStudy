import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ParticipantCodePage from "@/app/participant-code/page";
import { getParticipantAssignment } from "@/lib/api";

const push = vi.fn(); const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));
vi.mock("@/lib/api", async importOriginal => ({ ...(await importOriginal<typeof import("@/lib/api")>()), getParticipantAssignment: vi.fn() }));
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); sessionStorage.setItem("informationViewed", "true"); sessionStorage.setItem("consentCompleted", "true"); });

describe("participant code allocation", () => {
  it("rejects an invalid code without calling the backend", () => {
    render(<ParticipantCodePage />); fireEvent.change(screen.getByLabelText("Participant code"), { target: { value: "P99" } }); fireEvent.click(screen.getByRole("button", { name: /Continue to scenario/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("P01–P10"); expect(getParticipantAssignment).not.toHaveBeenCalled();
  });
  it("stores the authoritative backend assignment without showing method selection", async () => {
    vi.mocked(getParticipantAssignment).mockResolvedValue({ participant_code: "P05", assigned_method: "LIME" });
    render(<ParticipantCodePage />); fireEvent.change(screen.getByLabelText("Participant code"), { target: { value: "P05" } }); fireEvent.click(screen.getByRole("button", { name: /Continue to scenario/ }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/scenario"));
    expect(sessionStorage.getItem("assignedMethod")).toBe("LIME"); expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
