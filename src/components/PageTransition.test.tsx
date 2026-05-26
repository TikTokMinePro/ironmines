import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageTransition, PageSection } from "./PageTransition";

describe("PageTransition", () => {
  it("renders children", () => {
    render(<PageTransition><p>Hello</p></PageTransition>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<PageTransition className="space-y-4"><p>Test</p></PageTransition>);
    expect(container.firstChild).toHaveClass("space-y-4");
  });

  it("renders with default empty className", () => {
    const { container } = render(<PageTransition><p>Test</p></PageTransition>);
    expect(container.firstChild).toBeTruthy();
  });

  it("accepts delay prop without error", () => {
    const { container } = render(<PageTransition delay={0.5}><p>Delayed</p></PageTransition>);
    expect(screen.getByText("Delayed")).toBeInTheDocument();
  });
});

describe("PageSection", () => {
  it("renders children", () => {
    render(
      <PageTransition>
        <PageSection><span>Section content</span></PageSection>
      </PageTransition>
    );
    expect(screen.getByText("Section content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <PageTransition>
        <PageSection className="mt-4"><span>Styled</span></PageSection>
      </PageTransition>
    );
    expect(screen.getByText("Styled").parentElement).toHaveClass("mt-4");
  });
});
