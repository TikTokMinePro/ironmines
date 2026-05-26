/**
 * Shared formatting utilities for numbers and currency.
 * Consolidates duplicated formatters from Dashboard, Products, Videos, Creators, etc.
 */

/** Compact number: 1500 → "1.5k", 2000000 → "2.0M" */
export function formatNumber(n: number): string {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toLocaleString("pt-BR");
}

/** Compact number with optional prefix: fmt(1500, "R$") → "R$1.5k" */
export function fmt(n: number | null | undefined, prefix = ""): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}k`;
  return `${prefix}${n.toLocaleString("pt-BR")}`;
}

/** Compact BRL currency: 1500 → "R$1.5k" */
export function fmtBRL(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `R$${(n / 1_000).toFixed(1)}k`;
  return `R$${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Full BRL price: 69.90 → "R$69,90" */
export function fmtPrice(n: number | null | undefined): string {
  if (n == null) return "—";
  return `R$${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** BRL from cents: 6990 → "R$ 69,90" (used in admin/plans) */
export function fmtCents(cents: number): string {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Whole BRL (no decimals): 15000 → "R$ 15.000" */
export function fmtBRLWhole(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
}
