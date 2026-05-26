import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VideoThumbnail } from "./VideoThumbnail";

// Mock fetch for oembed fallback
global.fetch = vi.fn(() => Promise.reject(new Error("no oembed"))) as any;

describe("VideoThumbnail", () => {
  it("renders image when thumbnailUrl is provided", () => {
    render(<VideoThumbnail thumbnailUrl="https://example.com/thumb.jpg" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/thumb.jpg");
  });

  it("uses caption as alt text", () => {
    render(<VideoThumbnail thumbnailUrl="https://example.com/thumb.jpg" caption="My video" />);
    expect(screen.getByAltText("My video")).toBeInTheDocument();
  });

  it("falls back to default alt text when no caption", () => {
    render(<VideoThumbnail thumbnailUrl="https://example.com/thumb.jpg" />);
    expect(screen.getByAltText("Vídeo viral")).toBeInTheDocument();
  });

  it("shows placeholder when thumbnailUrl is null and no tiktokId", () => {
    render(<VideoThumbnail thumbnailUrl={null} creatorUsername="testuser" />);
    expect(screen.getByText("@testuser")).toBeInTheDocument();
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("shows placeholder when thumbnailUrl is undefined", () => {
    render(<VideoThumbnail thumbnailUrl={undefined} />);
    expect(screen.getByText("V")).toBeInTheDocument();
  });

  it("falls back to placeholder on image error without tiktokId", async () => {
    render(<VideoThumbnail thumbnailUrl="https://broken.url/img.jpg" creatorUsername="user1" />);
    const img = screen.getByRole("img");
    fireEvent.error(img);
    // Without tiktokId, oembed fails immediately → shows placeholder
    await vi.waitFor(() => {
      expect(screen.getByText("U")).toBeInTheDocument();
      expect(screen.getByText("@user1")).toBeInTheDocument();
    });
  });

  it("applies custom className", () => {
    const { container } = render(<VideoThumbnail thumbnailUrl={null} className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("generates deterministic gradient - same username produces same result", () => {
    const { container: c1 } = render(<VideoThumbnail thumbnailUrl={null} creatorUsername="alice" />);
    const { container: c2 } = render(<VideoThumbnail thumbnailUrl={null} creatorUsername="alice" />);
    const div1 = c1.firstChild as HTMLElement;
    const div2 = c2.firstChild as HTMLElement;
    expect(div1.getAttribute("style")).toBe(div2.getAttribute("style"));
  });

  it("uses lazy loading for images", () => {
    render(<VideoThumbnail thumbnailUrl="https://example.com/thumb.jpg" />);
    expect(screen.getByRole("img")).toHaveAttribute("loading", "lazy");
  });

  it("accepts tiktokId prop", () => {
    render(<VideoThumbnail thumbnailUrl="https://example.com/thumb.jpg" tiktokId="123456" />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });
});
