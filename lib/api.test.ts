import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, getParticipantAssignment } from "@/lib/api";

afterEach(() => vi.unstubAllGlobals());

describe("API client", () => {
  it("uses the backend participant assignment", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ participant_code: "P05", assigned_method: "LIME" }) }));
    await expect(getParticipantAssignment("P05")).resolves.toEqual({ participant_code: "P05", assigned_method: "LIME" });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/study/participants/P05"), expect.anything());
  });

  it("distinguishes an invalid participant code", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(getParticipantAssignment("P99")).rejects.toMatchObject({ status: 404 });
  });

  it("reports network failure without exposing technical details", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("socket detail")));
    await expect(getParticipantAssignment("P01")).rejects.toEqual(new ApiError(null, "The study service is currently unavailable."));
  });
});
