import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SectionProduct } from "./SectionProduct";

describe("SectionProduct", () => {
  const mockProducts = [
    { id: "p1", title: "Sérum Vitamina C", price: 49.90, image_url: "https://example.com/serum.jpg" },
    { id: "p2", title: "Creme Hidratante", price: 29.90, image_url: null },
  ];

  const baseProps = {
    products: mockProducts,
    selected: null as any,
    onSelect: vi.fn(),
    uploadedImage: null as string | null,
    onUpload: vi.fn(),
    productName: "",
    onProductNameChange: vi.fn(),
    variants: [] as any[],
    selectedVariant: null,
    onVariantSelect: vi.fn(),
  };

  beforeEach(() => vi.clearAllMocks());

  it("renders tabs for Produtos Virais and Upload", () => {
    render(<SectionProduct {...baseProps} />);
    expect(screen.getByText("Produtos Virais")).toBeInTheDocument();
    expect(screen.getByText("Upload")).toBeInTheDocument();
  });

  it("renders product grid with product titles", () => {
    render(<SectionProduct {...baseProps} />);
    expect(screen.getByText("Sérum Vitamina C")).toBeInTheDocument();
    expect(screen.getByText("Creme Hidratante")).toBeInTheDocument();
  });

  it("calls onSelect when product is clicked", () => {
    render(<SectionProduct {...baseProps} />);
    fireEvent.click(screen.getByText("Sérum Vitamina C"));
    expect(baseProps.onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "p1", title: "Sérum Vitamina C" })
    );
  });

  it("shows selected product card", () => {
    render(<SectionProduct {...baseProps} selected={mockProducts[0]} />);
    expect(screen.getByText("✓ Selecionado")).toBeInTheDocument();
  });

  it("renders skeletons when products are empty", () => {
    const { container } = render(<SectionProduct {...baseProps} products={[]} />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("switches to Upload tab", () => {
    render(<SectionProduct {...baseProps} />);
    fireEvent.click(screen.getByText("Upload"));
    expect(screen.getByText("Arraste uma imagem ou clique para enviar")).toBeInTheDocument();
  });

  it("shows upload preview when uploadedImage is set", () => {
    render(<SectionProduct {...baseProps} uploadedImage="https://example.com/uploaded.jpg" />);
    // Switch to upload tab to see preview
    fireEvent.click(screen.getByText("Upload"));
    expect(screen.getByText("Clique ou arraste para trocar")).toBeInTheDocument();
  });

  it("renders product name input in upload tab", () => {
    render(<SectionProduct {...baseProps} />);
    fireEvent.click(screen.getByText("Upload"));
    expect(screen.getByPlaceholderText("Ex: Sérum Vitamina C 30ml")).toBeInTheDocument();
  });

  it("calls onProductNameChange when typing product name", () => {
    render(<SectionProduct {...baseProps} />);
    fireEvent.click(screen.getByText("Upload"));
    const input = screen.getByPlaceholderText("Ex: Sérum Vitamina C 30ml");
    fireEvent.change(input, { target: { value: "Novo Produto" } });
    expect(baseProps.onProductNameChange).toHaveBeenCalledWith("Novo Produto");
  });

  it("shows variants when 2+ variants exist and product is selected", () => {
    const variants = [
      { id: "v1", variant_label: "Azul", variant_image_url: null, is_default: true },
      { id: "v2", variant_label: "Rosa", variant_image_url: null, is_default: false },
    ];
    render(<SectionProduct {...baseProps} selected={mockProducts[0]} variants={variants} />);
    expect(screen.getByText("Selecione a variação:")).toBeInTheDocument();
    expect(screen.getByText("Azul")).toBeInTheDocument();
    expect(screen.getByText("Rosa")).toBeInTheDocument();
  });

  it("does not show variants when only 1 variant", () => {
    const variants = [
      { id: "v1", variant_label: "Padrão", variant_image_url: null, is_default: true },
    ];
    render(<SectionProduct {...baseProps} selected={mockProducts[0]} variants={variants} />);
    expect(screen.queryByText("Selecione a variação:")).not.toBeInTheDocument();
  });

  it("calls onVariantSelect when variant is clicked", () => {
    const variants = [
      { id: "v1", variant_label: "Azul", variant_image_url: null, is_default: true },
      { id: "v2", variant_label: "Rosa", variant_image_url: null, is_default: false },
    ];
    render(<SectionProduct {...baseProps} selected={mockProducts[0]} variants={variants} />);
    fireEvent.click(screen.getByText("Rosa"));
    expect(baseProps.onVariantSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "v2", variant_label: "Rosa" })
    );
  });

  it("shows price formatted correctly in selected card", () => {
    render(<SectionProduct {...baseProps} selected={mockProducts[0]} />);
    expect(screen.getByText("R$ 49,90")).toBeInTheDocument();
  });
});
