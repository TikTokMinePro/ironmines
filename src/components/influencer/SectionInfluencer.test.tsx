import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SectionInfluencer } from "./SectionInfluencer";

describe("SectionInfluencer", () => {
  const mockAvatars = [
    { id: "a1", name: "Ana", image_url: "https://example.com/ana.jpg", gender: "female" },
    { id: "a2", name: "Maria", image_url: "https://example.com/maria.jpg", gender: "female" },
    { id: "a3", name: "Carlos", image_url: "https://example.com/carlos.jpg", gender: "male" },
  ];

  const baseProps = {
    avatars: mockAvatars,
    selected: null as any,
    onSelect: vi.fn(),
  };

  beforeEach(() => vi.clearAllMocks());

  it("renders tabs for Avatares Prontos and Upload", () => {
    render(<SectionInfluencer {...baseProps} />);
    expect(screen.getByText("Avatares Prontos")).toBeInTheDocument();
    expect(screen.getByText("Upload")).toBeInTheDocument();
  });

  it("renders gender tabs", () => {
    render(<SectionInfluencer {...baseProps} />);
    expect(screen.getByText("Mulheres")).toBeInTheDocument();
    expect(screen.getByText("Homens")).toBeInTheDocument();
  });

  it("filters avatars by gender - shows female by default", () => {
    render(<SectionInfluencer {...baseProps} />);
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Maria")).toBeInTheDocument();
    expect(screen.queryByText("Carlos")).not.toBeInTheDocument();
  });

  it("shows male avatars when Homens tab is clicked", () => {
    render(<SectionInfluencer {...baseProps} />);
    fireEvent.click(screen.getByText("Homens"));
    expect(screen.getByText("Carlos")).toBeInTheDocument();
    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
  });

  it("calls onSelect when avatar is clicked", () => {
    render(<SectionInfluencer {...baseProps} />);
    fireEvent.click(screen.getByText("Ana"));
    expect(baseProps.onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a1", name: "Ana" })
    );
  });

  it("shows selected avatar card when one is selected", () => {
    render(<SectionInfluencer {...baseProps} selected={mockAvatars[0]} />);
    expect(screen.getByText("✓ Selecionado")).toBeInTheDocument();
    expect(screen.getAllByText("Ana").length).toBeGreaterThanOrEqual(1);
  });

  it("shows skeletons when avatars are empty", () => {
    const { container } = render(<SectionInfluencer {...baseProps} avatars={[]} />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("switches to Upload tab", () => {
    render(<SectionInfluencer {...baseProps} />);
    fireEvent.click(screen.getByText("Upload"));
    expect(screen.getByText("Clique para enviar sua foto")).toBeInTheDocument();
  });

  it("includes avatars without gender in female filter", () => {
    const avatarsNoGender = [
      ...mockAvatars,
      { id: "a4", name: "Teste", image_url: "https://example.com/teste.jpg", gender: null },
    ];
    render(<SectionInfluencer {...baseProps} avatars={avatarsNoGender} />);
    // Avatars without gender (!a.gender) pass the filter for both
    expect(screen.getByText("Teste")).toBeInTheDocument();
  });
});
