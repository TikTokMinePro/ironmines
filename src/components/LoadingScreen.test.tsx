import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingScreen } from "./LoadingScreen";

describe("LoadingScreen", () => {
  it("renders the loading text", () => {
    render(<LoadingScreen />);
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("renders the IronMines logo", () => {
    render(<LoadingScreen />);
    expect(screen.getByAltText("IronMines")).toBeInTheDocument();
  });

  it("has fixed positioning for full-screen overlay", () => {
    const { container } = render(<LoadingScreen />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("fixed", "inset-0", "z-50");
  });

  it("logo has correct styling classes", () => {
    render(<LoadingScreen />);
    const logo = screen.getByAltText("IronMines");
    expect(logo).toHaveClass("mx-auto");
  });
});
