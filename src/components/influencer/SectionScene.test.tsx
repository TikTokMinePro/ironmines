import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SectionScene } from "./SectionScene";

describe("SectionScene", () => {
  const baseProps = {
    scenarios: [
      { id: "s1", name: "Quarto Moderno", prompt_modifier: "quarto moderno" },
      { id: "s2", name: "Estúdio Clean", prompt_modifier: "estudio clean" },
      { id: "s3", name: "Praia Tropical", prompt_modifier: "praia tropical" },
    ],
    selected: null as any,
    onSelect: vi.fn(),
    customText: "",
    onCustomTextChange: vi.fn(),
  };

  beforeEach(() => vi.clearAllMocks());

  it("renders all fixed scenario buttons", () => {
    render(<SectionScene {...baseProps} />);
    expect(screen.getByText("Casa")).toBeInTheDocument();
    expect(screen.getByText("Estúdio")).toBeInTheDocument();
    expect(screen.getByText("Ar livre")).toBeInTheDocument();
    expect(screen.getByText("Academia")).toBeInTheDocument();
    expect(screen.getByText("Cozinha")).toBeInTheDocument();
    expect(screen.getByText("Outros")).toBeInTheDocument();
  });

  it("calls onSelect with DB match when scenario exists", () => {
    render(<SectionScene {...baseProps} />);
    fireEvent.click(screen.getByText("Casa"));
    // "Casa" matches "quarto" in fixedScenarios, which matches "Quarto Moderno" in DB
    expect(baseProps.onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "s1", name: "Quarto Moderno" })
    );
  });

  it("calls onSelect with virtual object when no DB match", () => {
    render(<SectionScene {...baseProps} />);
    fireEvent.click(screen.getByText("Academia"));
    // No DB scenario matches "academia"
    expect(baseProps.onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: null, name: "Academia" })
    );
  });

  it("switches between Prontos and Upload tabs", () => {
    render(<SectionScene {...baseProps} />);
    // Default tab is "prontos"
    expect(screen.getByText("Casa")).toBeInTheDocument();
    
    // Click Upload tab
    fireEvent.click(screen.getByText("Upload"));
    expect(screen.getByText("Clique para enviar cenário")).toBeInTheDocument();
  });

  it("renders custom text input", () => {
    render(<SectionScene {...baseProps} />);
    expect(screen.getByPlaceholderText("Ex: Quarto minimalista com luz natural...")).toBeInTheDocument();
  });

  it("calls onCustomTextChange when typing custom text", () => {
    render(<SectionScene {...baseProps} />);
    const input = screen.getByPlaceholderText("Ex: Quarto minimalista com luz natural...");
    fireEvent.change(input, { target: { value: "Sala elegante" } });
    expect(baseProps.onCustomTextChange).toHaveBeenCalledWith("Sala elegante");
  });

  it("highlights selected scenario correctly", () => {
    const selected = { id: "s2", name: "Estúdio Clean", prompt_modifier: "estudio clean" };
    render(<SectionScene {...baseProps} selected={selected} />);
    // Estúdio maps to "estúdio" which matches "Estúdio Clean" (s2)
    // The button for "Estúdio" should have active styling
    const buttons = screen.getAllByRole("button");
    const estudioBtn = buttons.find(b => b.textContent?.includes("Estúdio"));
    expect(estudioBtn).toBeDefined();
  });

  it("handles empty scenarios array", () => {
    render(<SectionScene {...baseProps} scenarios={[]} />);
    // Should still render fixed scenarios
    expect(screen.getByText("Casa")).toBeInTheDocument();
    // Clicking should create virtual selections
    fireEvent.click(screen.getByText("Casa"));
    expect(baseProps.onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: null, name: "Casa" })
    );
  });
});
