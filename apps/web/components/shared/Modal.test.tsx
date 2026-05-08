import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Modal } from "./Modal";

describe("Modal", () => {
  it("does not render when closed", () => {
    render(
      <Modal open={false} onClose={() => {}}>
        Hidden
      </Modal>,
    );
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("renders content + title when open", () => {
    render(
      <Modal open onClose={() => {}} title="Settings">
        Body content
      </Modal>,
    );
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Settings">
        Body
      </Modal>,
    );
    await userEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose on Escape key", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose}>
        Body
      </Modal>,
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("renders footer slot", () => {
    render(
      <Modal open onClose={() => {}} footer={<button>Apply</button>}>
        Body
      </Modal>,
    );
    expect(screen.getByRole("button", { name: "Apply" })).toBeInTheDocument();
  });
});
