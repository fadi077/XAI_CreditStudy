import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { getParticipantAssignment } from "@/lib/api";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api")>();
  return { ...original, getParticipantAssignment: vi.fn() };
});

beforeAll(() => {
  class Observer { observe() {} unobserve() {} disconnect() {} }
  vi.stubGlobal("IntersectionObserver", Observer);
});
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); });

function submit(code: string) {
  fireEvent.change(screen.getByLabelText("Participant code"), { target: { value: code } });
  fireEvent.click(screen.getByRole("button", { name: "Begin Study" }));
}

describe("participant code flow", () => {
  it("validates the code shape before calling the API", () => {
    render(<Home />); submit("P99");
    expect(screen.getByRole("alert")).toHaveTextContent("P01–P10");
    expect(getParticipantAssignment).not.toHaveBeenCalled();
  });

  it("stores and follows the backend assignment", async () => {
    vi.mocked(getParticipantAssignment).mockResolvedValue({ participant_code: "P01", assigned_method: "SHAP" });
    render(<Home />); submit("P01");
    await waitFor(() => expect(push).toHaveBeenCalledWith("/scenario"));
    expect(sessionStorage.getItem("assignedMethod")).toBe("SHAP");
  });

  it("shows a participant-friendly API failure", async () => {
    vi.mocked(getParticipantAssignment).mockRejectedValue(new Error("connection refused"));
    render(<Home />); submit("P01");
    expect(await screen.findByRole("alert")).toHaveTextContent("temporarily unavailable");
  });
});
