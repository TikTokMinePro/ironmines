import { describe, it, expect } from "vitest";
import { formatNumber, fmt, fmtBRL, fmtPrice, fmtCents, fmtBRLWhole } from "./formatters";

describe("formatNumber", () => {
  it("returns '0' for 0", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("returns '0' for NaN-like falsy values", () => {
    expect(formatNumber(NaN)).toBe("0");
  });

  it("formats thousands with k suffix", () => {
    expect(formatNumber(1500)).toBe("1.5k");
    expect(formatNumber(1000)).toBe("1k");
    expect(formatNumber(9999)).toBe("10k");
  });

  it("formats millions with M suffix", () => {
    expect(formatNumber(1000000)).toBe("1M");
    expect(formatNumber(2500000)).toBe("2.5M");
    expect(formatNumber(1200000)).toBe("1.2M");
  });

  it("formats numbers below 1000 with locale", () => {
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(1)).toBe("1");
  });

  it("removes trailing .0 from k values", () => {
    expect(formatNumber(2000)).toBe("2k");
    expect(formatNumber(3000)).toBe("3k");
  });

  it("removes trailing .0 from M values", () => {
    expect(formatNumber(5000000)).toBe("5M");
  });
});

describe("fmt", () => {
  it("returns '—' for null", () => {
    expect(fmt(null)).toBe("—");
  });

  it("returns '—' for undefined", () => {
    expect(fmt(undefined)).toBe("—");
  });

  it("formats millions with prefix", () => {
    expect(fmt(2000000, "R$")).toBe("R$2.0M");
  });

  it("formats thousands with prefix", () => {
    expect(fmt(1500, "$")).toBe("$1.5k");
  });

  it("formats small numbers with locale", () => {
    expect(fmt(42)).toContain("42");
  });

  it("works without prefix", () => {
    expect(fmt(1500)).toBe("1.5k");
  });

  it("handles zero", () => {
    expect(fmt(0)).toBe("0");
  });
});

describe("fmtBRL", () => {
  it("returns '—' for null", () => {
    expect(fmtBRL(null)).toBe("—");
  });

  it("returns '—' for undefined", () => {
    expect(fmtBRL(undefined)).toBe("—");
  });

  it("formats millions", () => {
    expect(fmtBRL(1500000)).toBe("R$1.5M");
  });

  it("formats thousands", () => {
    expect(fmtBRL(5000)).toBe("R$5.0k");
  });

  it("formats small values with R$ and decimals", () => {
    const result = fmtBRL(49.9);
    expect(result).toContain("R$");
    expect(result).toContain("49");
  });

  it("formats zero", () => {
    const result = fmtBRL(0);
    expect(result).toContain("R$");
    expect(result).toContain("0");
  });
});

describe("fmtPrice", () => {
  it("returns '—' for null", () => {
    expect(fmtPrice(null)).toBe("—");
  });

  it("returns '—' for undefined", () => {
    expect(fmtPrice(undefined)).toBe("—");
  });

  it("formats price with R$ prefix", () => {
    const result = fmtPrice(69.9);
    expect(result).toContain("R$");
    expect(result).toContain("69");
  });

  it("formats zero price", () => {
    const result = fmtPrice(0);
    expect(result).toContain("R$");
    expect(result).toContain("0,00");
  });

  it("formats large prices without compact notation", () => {
    const result = fmtPrice(15000);
    expect(result).toContain("R$");
    expect(result).toContain("15");
  });
});

describe("fmtCents", () => {
  it("converts cents to reais", () => {
    const result = fmtCents(6990);
    expect(result).toContain("R$");
    expect(result).toContain("69");
    expect(result).toContain("90");
  });

  it("handles zero cents", () => {
    const result = fmtCents(0);
    expect(result).toContain("R$");
    expect(result).toContain("0,00");
  });

  it("handles large amounts", () => {
    const result = fmtCents(39990);
    expect(result).toContain("399");
    expect(result).toContain("90");
  });
});

describe("fmtBRLWhole", () => {
  it("formats without decimals", () => {
    const result = fmtBRLWhole(15000);
    expect(result).toContain("R$");
    expect(result).toContain("15");
    // Should not have decimal separator for whole numbers
    expect(result).not.toContain(",");
  });

  it("formats zero", () => {
    const result = fmtBRLWhole(0);
    expect(result).toContain("R$");
    expect(result).toContain("0");
  });

  it("rounds decimal values", () => {
    const result = fmtBRLWhole(1500.75);
    expect(result).toContain("R$");
    expect(result).toContain("1");
  });
});
