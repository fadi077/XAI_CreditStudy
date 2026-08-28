import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("landing page", () => {
  it("starts the one-scenario participant flow without dataset or method selection", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: /Read participant information/ })).toHaveAttribute("href", "/information");
    expect(screen.getByText(/one fictional credit scenario/i)).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText(/German Credit|HELOC|Select dataset/i)).not.toBeInTheDocument();
  });
});
