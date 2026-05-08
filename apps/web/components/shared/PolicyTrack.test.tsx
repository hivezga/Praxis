import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PolicyTrack } from "./PolicyTrack";
import type { PolicyDefinition } from "@/lib/data/policies";

const FIXTURE: PolicyDefinition = {
  id: "taxation",
  number: 3,
  name: "Taxation",
  axis: "leftRight",
  sections: {
    A: { label: "High tax",   tooltip: "" },
    B: { label: "Medium tax", tooltip: "" },
    C: { label: "Low tax",    tooltip: "" },
  },
};

describe("PolicyTrack", () => {
  it("renders policy number, name and current section", () => {
    render(<PolicyTrack policy={FIXTURE} position="B" />);
    expect(screen.getByText("Taxation")).toBeInTheDocument();
    expect(screen.getByText("3.")).toBeInTheDocument();
    expect(screen.getByText("Medium tax")).toBeInTheDocument();
  });

  it("marks the active section with aria-pressed", () => {
    render(<PolicyTrack policy={FIXTURE} position="A" />);
    const aBtn = screen.getByLabelText(/section A/);
    expect(aBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onChange with the clicked section", async () => {
    const onChange = vi.fn();
    render(<PolicyTrack policy={FIXTURE} position="A" onChange={onChange} />);
    await userEvent.click(screen.getByLabelText(/section C/));
    expect(onChange).toHaveBeenCalledWith("C");
  });
});
