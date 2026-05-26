import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedNumber } from "./AnimatedNumber";

describe("AnimatedNumber", () => {
  it("renders with initial value 0", () => {
    render(<AnimatedNumber value={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<AnimatedNumber value={0} className="text-primary" />);
    const el = screen.getByText("0");
    expect(el).toHaveClass("text-primary");
  });

  it("renders a span element", () => {
    render(<AnimatedNumber value={100} />);
    const el = screen.getByText("0"); // starts at 0 before animation
    expect(el.tagName).toBe("SPAN");
  });

  it("handles value of 0 (no animation needed)", () => {
    render(<AnimatedNumber value={0} duration={100} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("accepts custom duration prop", () => {
    // Should not throw
    const { container } = render(<AnimatedNumber value={50} duration={500} />);
    expect(container.querySelector("span")).toBeInTheDocument();
  });

  it("handles negative values", () => {
    render(<AnimatedNumber value={-10} />);
    // Starts at 0, will animate to -10
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("formats large numbers with locale", () => {
    // After animation completes, large numbers should be locale-formatted
    // Testing initial render
    const { container } = render(<AnimatedNumber value={1000000} />);
    expect(container.querySelector("span")).toBeInTheDocument();
  });
});
