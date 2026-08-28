import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Scenario from "@/app/scenario/page";
import { getParticipantStimulus } from "@/lib/api";
import { participantStimulus } from "@/test-utils/participant-stimulus";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace }) }));
vi.mock("@/lib/api", async importOriginal => ({ ...(await importOriginal<typeof import("@/lib/api")>()), getParticipantStimulus: vi.fn() }));
vi.mock("@/lib/study-session", () => ({ readStudySession: () => ({ code: "P01", method: "SHAP" }) }));
beforeEach(() => vi.mocked(getParticipantStimulus).mockResolvedValue(participantStimulus("SHAP")));

describe("single approved scenario", () => {
  it("renders the exact Alex stimulus and decision without technical identifiers", async () => {
    render(<Scenario />);
    expect(await screen.findByText(/Alex is a working applicant who rents their home/)).toBeInTheDocument();
    expect(screen.getByText("AI decision: Application rejected.")).toBeInTheDocument();
    expect(screen.getByText(/dataset’s recorded units rather than a real-world currency/)).toBeInTheDocument();
    expect(screen.queryByText(/XAI_001|GER_XAI|HELOC_XAI|AMT_/)).not.toBeInTheDocument();
  });
});
