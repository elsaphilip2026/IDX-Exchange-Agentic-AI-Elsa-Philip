import assert from "node:assert/strict";
import { orchestrate } from "./orchestrator";
import { agentRegistry } from "./agent-registry";
import { getSession, clearSession } from "./session-memory";

async function main() {
  const userId = "orchestrator-safeguards-test";

  clearSession(userId);

  const originalSearch = agentRegistry.search;
  const originalMarket = agentRegistry.market;

  assert.ok(originalSearch);
  assert.ok(originalMarket);

  try {
    console.log("\n===== ORCHESTRATOR SAFEGUARD TESTS =====\n");

    // Establish a valid search session.
    await orchestrate(
      "Find homes in Irvine under $1.2M with at least 3 bedrooms",
      userId
    );

    assert.ok(getSession(userId).lastResults?.length);

    console.log("PASS: Initial search context established");

    // Simulate a standalone market agent failure.
    agentRegistry.market = async () => {
      throw new Error("Simulated market failure");
    };

    const market = await orchestrate(
      "Show market trends in Irvine",
      userId
    );

    assert.equal(market.route, "agent-error");
    assert.ok(market.reply.includes("could not be retrieved"));

    console.log("PASS: Standalone market failure handled");

    assert.ok(getSession(userId).lastResults?.length);

    console.log("PASS: Market failure preserves property results");

    agentRegistry.market = originalMarket;

    // Simulate a standalone property search failure.
    agentRegistry.search = async () => {
      throw new Error("Simulated search failure");
    };

    const failed = await orchestrate(
      "Find homes in Pasadena",
      userId
    );

    assert.equal(failed.route, "agent-error");

    console.log("PASS: Standalone search failure handled");

    assert.equal(getSession(userId).lastResults?.length, 0);

    console.log("PASS: Stale property results cleared");

    assert.equal(getSession(userId).city, "Irvine");
    assert.equal(getSession(userId).maxPrice, 1200000);
    assert.equal(getSession(userId).bedrooms, 3);

    console.log("PASS: Existing search preferences preserved");

    // Verify email cannot use outdated properties.
    const email = await orchestrate(
      "Draft an email with these properties",
      userId
    );

    assert.equal(email.route, "email-draft");
    assert.equal(email.results[0]?.count, 0);

    console.log("PASS: Email cannot reuse stale listings");

    // Restore search and retrieve fresh results.
    agentRegistry.search = originalSearch;

    await orchestrate("Find homes in Irvine", userId);

    assert.ok(getSession(userId).lastResults?.length);

    console.log("PASS: Search recovers after failure");

    // Simulate an empty search result.
    agentRegistry.search = async () => ({
      agent: "search",
      route: "property-search",
      reply: "No matching properties found.",
      count: 0
    });

    await orchestrate("Find homes in Irvine", userId);

    assert.equal(getSession(userId).lastResults?.length, 0);

    console.log("PASS: Empty search clears previous listings");

    agentRegistry.search = originalSearch;

    // Verify central reset routing.
    const reset = await orchestrate("Reset", userId);

    assert.equal(reset.route, "session-reset");

    const session = getSession(userId);

    assert.equal(session.city, undefined);
    assert.equal(session.maxPrice, undefined);
    assert.equal(session.bedrooms, undefined);
    assert.equal(session.lastResults, undefined);
    assert.equal(session.page, 1);
    assert.equal(session.conversationStep, 0);

    console.log("PASS: Central reset clears all preferences");

    // Verify a new search works after reset.
    await orchestrate("Pasadena", userId);

    assert.equal(getSession(userId).city, "Pasadena");
    assert.equal(getSession(userId).maxPrice, undefined);
    assert.equal(getSession(userId).bedrooms, undefined);
    assert.ok(getSession(userId).lastResults?.length);

    console.log("PASS: Fresh conversation works after reset");

    console.log("\nALL 11 ORCHESTRATOR SAFEGUARD CHECKS PASSED");

  } finally {
    agentRegistry.search = originalSearch;
    agentRegistry.market = originalMarket;

    clearSession(userId);

    console.log("Original agents restored.");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Safeguard test failed:", error);
    process.exit(1);
  });
