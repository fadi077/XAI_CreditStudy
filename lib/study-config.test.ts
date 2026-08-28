import { describe, expect, it } from "vitest";
import { HUMAN_STUDY_MODEL_CONTEXT, STUDY_SCENARIO_ID, STUDY_STIMULUS_VALIDATED } from "@/lib/study-config";

describe("study configuration", () => {
  it("uses Home Credit only as the human-study model context", () => expect(HUMAN_STUDY_MODEL_CONTEXT).toBe("home_credit"));
  it("uses only the approved synthetic participant stimulus", () => expect(STUDY_SCENARIO_ID).toBe("SYNTHETIC_ALEX_001"));
  it("enables the project-lead-approved stimulus", () => expect(STUDY_STIMULUS_VALIDATED).toBe(true));
});
