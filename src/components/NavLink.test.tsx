import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NavLink } from "./NavLink";

describe("NavLink", () => {
  it("renders with text content", () => {
    render(
      <MemoryRouter>
        <NavLink to="/test">Test Link</NavLink>
      </MemoryRouter>
    );
    expect(screen.getByText("Test Link")).toBeInTheDocument();
  });

  it("renders as an anchor element", () => {
    render(
      <MemoryRouter>
        <NavLink to="/test">Link</NavLink>
      </MemoryRouter>
    );
    expect(screen.getByText("Link").closest("a")).toBeInTheDocument();
  });

  it("applies base className", () => {
    render(
      <MemoryRouter>
        <NavLink to="/test" className="base-class">Styled</NavLink>
      </MemoryRouter>
    );
    expect(screen.getByText("Styled").closest("a")).toHaveClass("base-class");
  });

  it("applies activeClassName when route is active", () => {
    render(
      <MemoryRouter initialEntries={["/active"]}>
        <NavLink to="/active" className="base" activeClassName="is-active">Active</NavLink>
      </MemoryRouter>
    );
    const link = screen.getByText("Active").closest("a");
    expect(link).toHaveClass("is-active");
  });

  it("does not apply activeClassName when route is inactive", () => {
    render(
      <MemoryRouter initialEntries={["/other"]}>
        <NavLink to="/test" className="base" activeClassName="is-active">Inactive</NavLink>
      </MemoryRouter>
    );
    const link = screen.getByText("Inactive").closest("a");
    expect(link).not.toHaveClass("is-active");
  });

  it("has correct href", () => {
    render(
      <MemoryRouter>
        <NavLink to="/dashboard">Dashboard</NavLink>
      </MemoryRouter>
    );
    expect(screen.getByText("Dashboard").closest("a")).toHaveAttribute("href", "/dashboard");
  });
});
