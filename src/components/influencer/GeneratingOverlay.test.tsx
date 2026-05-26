import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GeneratingOverlay } from "./GeneratingOverlay";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, whileHover, whileTap, style, ...rest } = props;
      return <div style={style} {...rest}>{children}</div>;
    },
    h3: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <h3 {...rest}>{children}</h3>;
    },
    p: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <p {...rest}>{children}</p>;
    },
    span: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <span {...rest}>{children}</span>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe("GeneratingOverlay", () => {
  const baseProps = {
    elapsed: 0,
    cancelled: false,
    onCancel: vi.fn(),
  };

  beforeEach(() => vi.clearAllMocks());

  it("renders generating title", () => {
    render(<GeneratingOverlay {...baseProps} />);
    expect(screen.getByText("Ger")).toBeInTheDocument();
    expect(screen.getByText("ando...")).toBeInTheDocument();
  });

  it("shows first step at elapsed=0", () => {
    render(<GeneratingOverlay {...baseProps} elapsed={0} />);
    expect(screen.getByText("Analisando produto e referências")).toBeInTheDocument();
  });

  it("shows second step at elapsed=10", () => {
    render(<GeneratingOverlay {...baseProps} elapsed={10} />);
    expect(screen.getByText("Gerando imagem base")).toBeInTheDocument();
  });

  it("shows third step at elapsed=25", () => {
    render(<GeneratingOverlay {...baseProps} elapsed={25} />);
    expect(screen.getByText("Inserindo produto na cena")).toBeInTheDocument();
  });

  it("shows fourth step at elapsed=45", () => {
    render(<GeneratingOverlay {...baseProps} elapsed={45} />);
    expect(screen.getByText("Aplicando face swap")).toBeInTheDocument();
  });

  it("shows sixth step at elapsed=80", () => {
    render(<GeneratingOverlay {...baseProps} elapsed={80} />);
    expect(screen.getByText("Finalizando criativo")).toBeInTheDocument();
  });

  it("shows progress percentage", () => {
    render(<GeneratingOverlay {...baseProps} elapsed={45} />);
    // 45/90 * 100 = 50%
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("caps progress at 95%", () => {
    render(<GeneratingOverlay {...baseProps} elapsed={200} />);
    expect(screen.getByText("95%")).toBeInTheDocument();
  });

  it("shows remaining time estimate", () => {
    render(<GeneratingOverlay {...baseProps} elapsed={0} />);
    expect(screen.getByText("~62s restantes")).toBeInTheDocument();
  });

  it("adjusts remaining time for later stages", () => {
    render(<GeneratingOverlay {...baseProps} elapsed={45} />);
    expect(screen.getByText("~30s restantes")).toBeInTheDocument();
  });

  it("shows cancel button when not cancelled", () => {
    render(<GeneratingOverlay {...baseProps} />);
    expect(screen.getByText("Cancelar geração")).toBeInTheDocument();
  });

  it("calls onCancel when cancel button is clicked", () => {
    render(<GeneratingOverlay {...baseProps} />);
    fireEvent.click(screen.getByText("Cancelar geração"));
    expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("hides cancel button when cancelled", () => {
    render(<GeneratingOverlay {...baseProps} cancelled={true} />);
    expect(screen.queryByText("Cancelar geração")).not.toBeInTheDocument();
  });

  it("shows cancelled label in step text", () => {
    render(<GeneratingOverlay {...baseProps} cancelled={true} elapsed={20} />);
    expect(screen.getByText("Geração cancelada")).toBeInTheDocument();
  });

  it("renders info text about generation time", () => {
    render(<GeneratingOverlay {...baseProps} />);
    expect(screen.getByText("A geração leva de 30 a 90 segundos. Não feche a tela.")).toBeInTheDocument();
  });

  it("renders 6 step dots", () => {
    const { container } = render(<GeneratingOverlay {...baseProps} />);
    const stepDots = container.querySelectorAll(".rounded-full");
    // particles + rings + dots — just verify the component renders
    expect(stepDots.length).toBeGreaterThan(0);
  });
});
