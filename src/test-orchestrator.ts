import assert from "node:assert/strict";
import { orchestrate } from "./orchestrator";
import { clearSession } from "./session-memory";

async function main() {
  const userId = "orchestrator-test-user";

  clearSession(userId);

  // Test 1: Automatic property search routing
  console.log("\n===== TEST 1: PROPERTY SEARCH =====\n");

  const search = await orchestrate(
    "Find homes in Irvine under $1200000 with at least 3 bedrooms",
    userId
  );

  console.log(search.reply);

  assert.equal(search.intent, "search");
  assert.deepEqual(search.agents, ["search"]);
  assert.ok((search.results[0].count ?? 0) > 0);

  console.log("PASS: Automatic property search routing");

  // Test 2: Automatic knowledge routing
  console.log("\n===== TEST 2: KNOWLEDGE =====\n");

  const knowledge = await orchestrate(
    "What is DOM?",
    userId
  );

  console.log(knowledge.reply);

  assert.equal(knowledge.intent, "knowledge");
  assert.deepEqual(knowledge.agents, ["knowledge"]);
  assert.equal(knowledge.route, "real-estate-glossary");

  console.log("PASS: Automatic knowledge routing");

  // Test 3: Automatic email routing
  console.log("\n===== TEST 3: EMAIL DRAFT =====\n");

  const email = await orchestrate(
    "Draft an email summarizing these properties",
    userId
  );

  console.log(email.reply);

  assert.equal(email.intent, "email");
  assert.deepEqual(email.agents, ["email"]);
  assert.ok((email.results[0].count ?? 0) > 0);

  console.log("PASS: Automatic email routing");

  // Test 4: Week 9 handbook mixed-intent example
  console.log("\n===== TEST 4: MIXED INTENT =====\n");

  const mixed = await orchestrate(
    "Find me affordable homes in Pasadena and tell me whether prices are rising.",
    "mixed-intent-test-user"
  );

  console.log(mixed.reply);

  assert.equal(mixed.intent, "mixed");
  assert.deepEqual(mixed.agents, ["search", "market"]);
  assert.equal(mixed.route, "multi-agent-orchestrator");
  assert.equal(mixed.results.length, 2);

  assert.ok(
    mixed.results.some(
      result => result.agent === "search"
    )
  );

  assert.ok(
    mixed.results.some(
      result => result.agent === "market"
    )
  );

  assert.ok(mixed.reply.includes("PROPERTY SEARCH RESULTS"));
  assert.ok(mixed.reply.includes("MARKET ANALYSIS"));

  console.log("PASS: Mixed-intent routing");
  console.log("PASS: Combined response formatting");

  console.log("\n===== EXECUTION SUMMARY =====\n");

  console.table(
    [search, knowledge, email, mixed].map(result => ({
      intent: result.intent,
      agents: result.agents.join(", "),
      route: result.route,
      executionTimeMs: result.executionTimeMs,
    }))
  );

  console.log("\nALL ORCHESTRATOR ROUTING TESTS PASSED");

  clearSession(userId);
  clearSession("mixed-intent-test-user");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Orchestrator test failed:", error);
    process.exit(1);
  });
