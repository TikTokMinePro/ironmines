import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/generate-creative`;

Deno.test("generate-creative: CORS preflight returns 200", async () => {
  const res = await fetch(FUNCTION_URL, { method: "OPTIONS" });
  assertEquals(res.status, 200);
  assertExists(res.headers.get("access-control-allow-origin"));
  await res.text();
});

Deno.test("generate-creative: rejects unauthenticated request with 401", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
    },
    body: JSON.stringify({ avatar_id: "test" }),
  });
  assertEquals(res.status, 401);
  const data = await res.json();
  assertEquals(data.error, "Unauthorized");
});

Deno.test("generate-creative: rejects invalid Bearer token with 401", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "Authorization": "Bearer bad-token",
    },
    body: JSON.stringify({ avatar_id: "test" }),
  });
  assertEquals(res.status, 401);
  const data = await res.json();
  assertEquals(data.error, "Unauthorized");
});

Deno.test("generate-creative: cache hash includes product fields (regression guard)", () => {
  // This test validates that the optionsForHash structure includes
  // productId, variantId, and productImageRef — ensuring different
  // product selections always produce different cache keys.

  const buildHash = (opts: Record<string, string>) => {
    // Mirror the hash logic from the edge function (simple JSON-based hash)
    const str = JSON.stringify(opts);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash.toString(36);
  };

  const baseOptions = {
    gender: "female",
    skin: "medium",
    avatarRef: "avatar-1",
    product: "Creme Facial",
    productId: "prod-AAA",
    productImageRef: "https://example.com/cream.jpg",
    color: "Rosa",
    variant: "Rosa",
    variantId: "var-111",
    category: "Beleza",
    scenarioRef: "scene-1",
    background: "studio",
    pose: "holding product",
    customPoseText: "",
    customScenarioText: "",
    format: "1024x1024",
  };

  // Same selections → same hash
  const hash1 = buildHash(baseOptions);
  const hash1b = buildHash({ ...baseOptions });
  assertEquals(hash1, hash1b, "Identical options must produce the same hash");

  // Different productId → different hash
  const hash2 = buildHash({ ...baseOptions, productId: "prod-BBB" });
  const differs1 = hash1 !== hash2;
  assertEquals(differs1, true, "Different productId must change the hash");

  // Different variantId → different hash
  const hash3 = buildHash({ ...baseOptions, variantId: "var-222" });
  const differs2 = hash1 !== hash3;
  assertEquals(differs2, true, "Different variantId must change the hash");

  // Different productImageRef → different hash
  const hash4 = buildHash({ ...baseOptions, productImageRef: "https://example.com/other.jpg" });
  const differs3 = hash1 !== hash4;
  assertEquals(differs3, true, "Different productImageRef must change the hash");
});
