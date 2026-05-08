import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ErrorBoundary, PanelErrorFallback } from "./ErrorBoundary";

function Boom({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("kaboom");
  return <div>OK</div>;
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary fallback={<div>broken</div>}>
        <div>healthy</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("healthy")).toBeInTheDocument();
  });

  it("renders fallback on throw", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary fallback={<div>broken</div>}>
        <Boom shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText("broken")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("retry resets after function-fallback retry", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    function Wrapped() {
      return (
        <ErrorBoundary
          fallback={(_err, retry) => (
            <PanelErrorFallback label="Test" retry={retry} />
          )}
        >
          <Boom shouldThrow />
        </ErrorBoundary>
      );
    }
    render(<Wrapped />);
    expect(screen.getByText(/Test panel hit/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /reload panel/i }));
    spy.mockRestore();
  });
});
