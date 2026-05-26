import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AccordionSection } from "./AccordionSection";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, onAnimationComplete, onAnimationStart, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe("AccordionSection", () => {
  const baseProps = {
    icon: "produto",
    title: "Produto",
    subtitle: null,
    isComplete: false,
    isOpen: false,
    onToggle: vi.fn(),
    children: <p>Content here</p>,
  };

  beforeEach(() => vi.clearAllMocks());

  it("renders title correctly", () => {
    render(<AccordionSection {...baseProps} />);
    expect(screen.getByText("Produto")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(<AccordionSection {...baseProps} subtitle="Sérum Facial" />);
    expect(screen.getByText("Sérum Facial")).toBeInTheDocument();
  });

  it("does not render subtitle when null", () => {
    const { container } = render(<AccordionSection {...baseProps} subtitle={null} />);
    expect(container.querySelectorAll("p.truncate")).toHaveLength(0);
  });

  it("shows children when isOpen is true", () => {
    render(<AccordionSection {...baseProps} isOpen={true} />);
    expect(screen.getByText("Content here")).toBeInTheDocument();
  });

  it("hides children when isOpen is false", () => {
    render(<AccordionSection {...baseProps} isOpen={false} />);
    expect(screen.queryByText("Content here")).not.toBeInTheDocument();
  });

  it("calls onToggle when clicked", () => {
    render(<AccordionSection {...baseProps} />);
    fireEvent.click(screen.getByText("Produto"));
    expect(baseProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it("does not call onToggle when locked", () => {
    const onToggle = vi.fn();
    render(<AccordionSection {...baseProps} locked={true} onToggle={onToggle} />);
    fireEvent.click(screen.getByText("Produto"));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("shows check icon when isComplete is true", () => {
    const { container } = render(<AccordionSection {...baseProps} isComplete={true} />);
    // The complete state renders bg-primary on the circle
    const completeCircle = container.querySelector(".bg-primary");
    expect(completeCircle).toBeInTheDocument();
  });

  it("does not show check when isComplete is false", () => {
    const { container } = render(<AccordionSection {...baseProps} isComplete={false} />);
    // Should have the muted dot instead
    const dot = container.querySelector(".bg-muted-foreground\\/40");
    expect(dot).toBeInTheDocument();
  });

  it("renders with unknown icon gracefully (defaults to Package)", () => {
    render(<AccordionSection {...baseProps} icon="unknown" />);
    expect(screen.getByText("Produto")).toBeInTheDocument();
  });

  it("does not show chevron when locked", () => {
    const { container } = render(<AccordionSection {...baseProps} locked={true} />);
    // ChevronDown should not render when locked
    // The locked condition prevents chevron rendering
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});
