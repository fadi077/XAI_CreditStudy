import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Debrief from "@/app/debrief/page";

describe("Debrief", () => {
  it("explains completion and does not expose a broken questionnaire link", () => {
    render(<Debrief />);
    expect(screen.getByRole("heading", { name: "Explanation viewing complete" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Questionnaire not yet available/ })).toBeDisabled();
  });
});
