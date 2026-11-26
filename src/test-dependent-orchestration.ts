import assert from "node:assert/strict";
import { orchestrate } from "./orchestrator";
import { agentRegistry } from "./agent-registry";
import { getSession, clearSession } from "./session-memory";

async function main() {
  const userId = "dependent-orchestration-test";

  clearSession(userId);

  const originalSearch = agentRegistry.search;
  const originalEmail = agentRegistry.email;

  assert.ok(originalSearch);
  assert.ok(originalEmail);

  try {
    console.log("\n===== DEPENDENCY EXECUTION TESTS =====\n");

    // Test 1: Search and email in one request.
    let result = await orchestrate(
      "Find homes in Irvine under $1.2M and draft an email with the results",
      userId
    );

    assert.equal(result.intent, "mixed");

    const search = result.results.find(
      item => item.agent === "search"
    );

    const email = result.results.find(
      item => item.agent === "email"
    );

    assert.ok(search);
    assert.ok(email);
    assert.equal(search.route, "property-search");
    assert.equal(email.route, "email-draft");
    assert.ok((search.count ?? 0) > 0);
    assert.equal(email.count, search.count);

    console.log("PASS: Search and email executed successfully");

    const listings = getSession(userId).lastResults;

    assert.ok(listings?.length);

    for (const listing of listings) {
      assert.ok(email.reply.includes(listing.L_Address));
    }

    console.log("PASS: Email contains fresh property results");

    // Track dependent agent execution.
    let emailCalls = 0;

    agentRegistry.email = async context => {
      emailCalls++;
      return originalEmail(context);
    };

    // Test 2: Search failure with previous listings saved.
    agentRegistry.search = async () => {
      throw new Error("Simulated property search failure");
    };

    result = await orchestrate(
      "Find homes in Pasadena and draft an email with the results",
      userId
    );

    assert.equal(
      result.results.find(
        item => item.agent === "search"
      )?.route,
      "agent-error"
    );

    assert.equal(
      result.results.find(
        item => item.agent === "email"
      )?.route,
      "dependency-skipped"
    );

    assert.equal(emailCalls, 0);

    console.log("PASS: Failed search skips dependent email");
    console.log("PASS: Stale listings are not used");

    // Test 3: Search succeeds but returns zero listings.
    agentRegistry.search = async () => ({
      agent: "search",
      route: "property-search",
      reply: "No matching properties found.",
      count: 0
    });

    result = await orchestrate(
      "Find homes in Irvine and draft an email with the results",
      userId
    );

    assert.equal(
      result.results.find(
        item => item.agent === "email"
      )?.route,
      "dependency-skipped"
    );

    assert.equal(emailCalls, 0);

    console.log("PASS: Empty search skips dependent email");

    // Restore actual search agent.
    agentRegistry.search = originalSearch;

    // Test 4: Independent agents still work.
    clearSession(userId);

    result = await orchestrate(
      "Find homes in Pasadena and show market trends",
      userId
    );

    assert.equal(result.intent, "mixed");

    assert.ok(
      (result.results.find(
        item => item.agent === "search"
      )?.count ?? 0) > 0
    );

    assert.ok(
      (result.results.find(
        item => item.agent === "market"
      )?.count ?? 0) > 0
    );

    console.log("PASS: Independent search and market execution");

    assert.deepEqual(
      result.results.map(item => item.agent),
      ["search", "market"]
    );

    console.log("PASS: Requested agent order preserved");

    console.log("\nALL 7 DEPENDENCY EXECUTION CHECKS PASSED");

  } finally {
    agentRegistry.search = originalSearch;
    agentRegistry.email = originalEmail;

    clearSession(userId);

    console.log("Original agents restored.");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Dependency execution test failed:", error);
    process.exit(1);
  });
