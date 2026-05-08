import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Counter } from "./Counter";

describe("Counter", () => {
  it("calls onAdjust with +1 when + clicked", async () => {
    const onAdjust = vi.fn();
    render(<Counter label="Money" value={5} onAdjust={onAdjust} />);
    await userEvent.click(screen.getByLabelText("Increase Money"));
    expect(onAdjust).toHaveBeenCalledWith(1);
  });

  it("calls onAdjust with -1 when − clicked", async () => {
    const onAdjust = vi.fn();
    render(<Counter label="Money" value={5} onAdjust={onAdjust} />);
    await userEvent.click(screen.getByLabelText("Decrease Money"));
    expect(onAdjust).toHaveBeenCalledWith(-1);
  });

  it("disables decrement at min", () => {
    render(<Counter label="Money" value={0} min={0} onAdjust={() => {}} />);
    expect(screen.getByLabelText("Decrease Money")).toBeDisabled();
  });

  it("disables increment at max", () => {
    render(<Counter label="Bills" value={3} max={3} onAdjust={() => {}} />);
    expect(screen.getByLabelText("Increase Bills")).toBeDisabled();
  });

  it("renders large variant when size=lg", () => {
    render(<Counter size="lg" label="Treasury" value={42} />);
    expect(screen.getByLabelText("Treasury")).toHaveValue(42);
  });

  it("calls onSet when input typed", async () => {
    const onSet = vi.fn();
    render(<Counter label="Money" value={0} onSet={onSet} max={99} />);
    const input = screen.getByLabelText("Money");
    await userEvent.clear(input);
    await userEvent.type(input, "7");
    expect(onSet).toHaveBeenLastCalledWith(7);
  });
});
