import { describe, expect, it } from "vitest";
import { HUMAN_STUDY_MODEL_CONTEXT, STUDY_SCENARIO_ID, STUDY_STIMULUS_VALIDATED } from "@/lib/study-config";

describe("study configuration", () => {
  it("uses Home Credit only as the human-study model context", () => expect(HUMAN_STUDY_MODEL_CONTEXT).toBe("home_credit"));
  it("uses a synthetic identifier rather than a technical XAI case", () => expect(STUDY_SCENARIO_ID).toBe("study_scenario_01"));
  it("keeps the unapproved stimulus disabled", () => expect(STUDY_STIMULUS_VALIDATED).toBe(false));
});
