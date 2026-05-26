import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/validate-coupon`;

Deno.test("validate-coupon: CORS preflight returns 200", async () => {
  const res = await fetch(FUNCTION_URL, { method: "OPTIONS" });
  assertEquals(res.status, 200);
  assertExists(res.headers.get("access-control-allow-origin"));
  await res.text();
});

Deno.test("validate-coupon: rejects unauthenticated request with 401", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
    },
    body: JSON.stringify({ code: "TEST" }),
  });
  assertEquals(res.status, 401);
  const data = await res.json();
  assertEquals(data.valid, false);
  assertEquals(data.error, "Não autorizado");
});

Deno.test("validate-coupon: rejects invalid Bearer token with 401", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "Authorization": "Bearer invalid-token-12345",
    },
    body: JSON.stringify({ code: "TEST" }),
  });
  assertEquals(res.status, 401);
  const data = await res.json();
  assertEquals(data.valid, false);
});
