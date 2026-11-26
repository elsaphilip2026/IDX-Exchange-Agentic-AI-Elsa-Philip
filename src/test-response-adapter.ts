import assert from "node:assert/strict";
import { orchestrate } from "./orchestrator";
import { adaptOrchestratorResponse } from "./orchestrator-response-adapter";
import { clearSession } from "./session-memory";

async function main() {
  const userId = "response-adapter-test";

  clearSession(userId);

  async function request(query: string) {
    const result = await orchestrate(query, userId);
    return adaptOrchestratorResponse(userId, result);
  }

  try {
    console.log("\n===== API RESPONSE ADAPTER TESTS =====\n");

    // Test 1: Property search
    const search = await request(
      "Find homes in Irvine under $1.2M with at least 3 bedrooms"
    );

    assert.equal(search.sessionId, userId);
    assert.equal(search.route, "property-search");
    assert.equal(search.intent, "search");
    assert.ok(Number(search.count) > 0);
    assert.ok(search.filters);
    assert.equal(search.needsCity, false);
    assert.equal("properties" in search, false);

    console.log("PASS: Property search response compatibility");

    // Test 2: Conversational filters
    const filters = search.filters as Record<string, unknown>;

    assert.equal(filters.maxPrice, 1200000);
    assert.equal(filters.bedrooms, 3);

    console.log("PASS: Search filters preserved");

    // Test 3: Glossary
    const glossary = await request("What does DOM mean?");

    assert.equal(glossary.route, "real-estate-glossary");
    assert.equal(glossary.intent, "knowledge");
    assert.ok(String(glossary.reply).includes("Days on Market"));

    console.log("PASS: Knowledge response compatibility");

    // Test 4: Email draft
    const email = await request(
      "Draft an email summarizing these properties"
    );

    assert.equal(email.route, "email-draft");

    const draft = email.emailDraft as Record<string, unknown>;

    assert.ok(draft.subject);
    assert.ok(draft.body);

    console.log("PASS: Structured email draft");

    // Test 5: Mixed intent
    const mixed = await request(
      "Find homes in Irvine under $1.2M and tell me whether prices are rising"
    );

    assert.equal(mixed.intent, "mixed");
    assert.equal(mixed.route, "multi-agent-orchestrator");
    assert.ok(mixed.marketAnalysis);
    assert.ok(Number(mixed.count) > 0);
    assert.ok(mixed.filters);

    assert.deepEqual(mixed.agents, ["search", "market"]);

    console.log("PASS: Mixed-intent response compatibility");

    // Test 6: Session reset
    const reset = await request("reset");

    assert.equal(reset.route, "session-reset");
    assert.equal(reset.count, 0);
    assert.equal(reset.needsCity, true);
    assert.deepEqual(reset.filters, {});

    console.log("PASS: Session reset compatibility");

    // Test 7: Missing city
    const clarification = await request("Under $800000");

    assert.equal(clarification.route, "property-search");
    assert.equal(clarification.needsCity, true);
    assert.equal(clarification.count, 0);

    console.log("PASS: City clarification compatibility");

    console.log("\nALL 7 API ADAPTER TESTS PASSED");

  } finally {
    clearSession(userId);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Adapter test failed:", error);
    process.exit(1);
  });
