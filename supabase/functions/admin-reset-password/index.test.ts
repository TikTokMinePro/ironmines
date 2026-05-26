import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/admin-reset-password`;

Deno.test("admin-reset-password: CORS preflight returns 200", async () => {
  const res = await fetch(FUNCTION_URL, { method: "OPTIONS" });
  assertEquals(res.status, 200);
  assertExists(res.headers.get("access-control-allow-origin"));
  await res.text();
});

Deno.test("admin-reset-password: rejects request without auth header", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
    },
    body: JSON.stringify({ user_id: "some-uuid" }),
  });
  assertEquals(res.status, 400);
  const data = await res.json();
  assertEquals(data.error, "Não autorizado");
});

Deno.test("admin-reset-password: rejects invalid token", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "Authorization": "Bearer invalid-token",
    },
    body: JSON.stringify({ user_id: "some-uuid" }),
  });
  assertEquals(res.status, 400);
  const data = await res.json();
  // Should return safe error message, not internal details
  assertExists(data.error);
  assertEquals(typeof data.error, "string");
});
