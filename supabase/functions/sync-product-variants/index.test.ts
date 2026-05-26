import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/sync-product-variants`;

Deno.test("sync-product-variants: CORS preflight returns 200", async () => {
  const res = await fetch(FUNCTION_URL, { method: "OPTIONS" });
  assertEquals(res.status, 200);
  assertExists(res.headers.get("access-control-allow-origin"));
  await res.text();
});

Deno.test("sync-product-variants: rejects unauthenticated request with 401", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
    },
    body: JSON.stringify({}),
  });
  assertEquals(res.status, 401);
  const data = await res.json();
  assertEquals(data.error, "Unauthorized");
});

Deno.test("sync-product-variants: rejects invalid token with 401", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "Authorization": "Bearer fake",
    },
    body: JSON.stringify({}),
  });
  assertEquals(res.status, 401);
  const data = await res.json();
  assertEquals(data.error, "Unauthorized");
});
