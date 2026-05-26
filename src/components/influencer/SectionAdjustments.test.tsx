import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SectionAdjustments } from "./SectionAdjustments";

describe("SectionAdjustments", () => {
  const mockPreset = (id: string, value: string, label: string) => ({
    id, value, label, icon_name: null, prompt_modifier: null,
  });

  const baseProps = {
    posePresets: [
      mockPreset("p1", "selfie", "Selfie"),
      mockPreset("p2", "mirror_selfie", "Mirror Selfie"),
    ],
    formatPresets: [
      mockPreset("f1", "vertical", "Vertical"),
      mockPreset("f2", "square", "Quadrado"),
    ],
    selectedPose: null as string | null,
    onPoseSelect: vi.fn(),
    selectedFormat: "vertical",
    onFormatSelect: vi.fn(),
    customPoseText: "",
    onCustomPoseTextChange: vi.fn(),
    additionalInfo: "",
    onAdditionalInfoChange: vi.fn(),
  };

  beforeEach(() => vi.clearAllMocks());

  it("renders section headers", () => {
    render(<SectionAdjustments {...baseProps} />);
    expect(screen.getByText("POSE")).toBeInTheDocument();
    expect(screen.getByText("FORMATO")).toBeInTheDocument();
  });

  it("renders pose presets", () => {
    render(<SectionAdjustments {...baseProps} />);
    expect(screen.getByText("Selfie")).toBeInTheDocument();
    expect(screen.getByText("Mirror Selfie")).toBeInTheDocument();
  });

  it("calls onPoseSelect when pose is clicked", () => {
    render(<SectionAdjustments {...baseProps} />);
    fireEvent.click(screen.getByText("Selfie"));
    expect(baseProps.onPoseSelect).toHaveBeenCalledWith("selfie");
  });

  it("calls onFormatSelect when format is clicked", () => {
    render(<SectionAdjustments {...baseProps} />);
    fireEvent.click(screen.getByText("Quadrado"));
    expect(baseProps.onFormatSelect).toHaveBeenCalledWith("square");
  });

  it("renders custom pose text input", () => {
    render(<SectionAdjustments {...baseProps} />);
    expect(screen.getByPlaceholderText(/Segurando o produto/)).toBeInTheDocument();
  });

  it("calls onCustomPoseTextChange when typing", () => {
    render(<SectionAdjustments {...baseProps} />);
    const textarea = screen.getByPlaceholderText(/Segurando o produto/);
    fireEvent.change(textarea, { target: { value: "Nova pose" } });
    expect(baseProps.onCustomPoseTextChange).toHaveBeenCalledWith("Nova pose");
  });

  it("renders additional info textarea", () => {
    render(<SectionAdjustments {...baseProps} />);
    expect(screen.getByPlaceholderText(/Sorriso natural/)).toBeInTheDocument();
  });

  it("calls onAdditionalInfoChange when typing", () => {
    render(<SectionAdjustments {...baseProps} />);
    const textarea = screen.getByPlaceholderText(/Sorriso natural/);
    fireEvent.change(textarea, { target: { value: "Luz natural" } });
    expect(baseProps.onAdditionalInfoChange).toHaveBeenCalledWith("Luz natural");
  });

  it("shows format labels correctly", () => {
    render(<SectionAdjustments {...baseProps} />);
    expect(screen.getByText("9:16")).toBeInTheDocument();
    expect(screen.getByText("1:1")).toBeInTheDocument();
  });

  it("handles empty preset arrays gracefully", () => {
    render(<SectionAdjustments {...baseProps} posePresets={[]} formatPresets={[]} />);
    expect(screen.getByText("POSE")).toBeInTheDocument();
  });
});
