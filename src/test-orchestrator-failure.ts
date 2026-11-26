import assert from "node:assert/strict";
import { orchestrate } from "./orchestrator";
import { agentRegistry } from "./agent-registry";
import { clearSession } from "./session-memory";

async function main() {
  const userId = "orchestrator-failure-test";

  clearSession(userId);

  // Preserve the original market agent.
  const originalMarketAgent = agentRegistry.market;

  assert.ok(originalMarketAgent);

  try {
    // Simulate a temporary market agent failure.
    agentRegistry.market = async () => {
      throw new Error("Simulated market agent failure");
    };

    console.log("\n===== SIMULATED AGENT FAILURE =====\n");

    const result = await orchestrate(
      "Find homes in Irvine under $1200000 and show market trends",
      userId
    );

    console.log(result.reply);

    const search = result.results.find(
      agent => agent.agent === "search"
    );

    const market = result.results.find(
      agent => agent.agent === "market"
    );

    assert.equal(result.intent, "mixed");
    assert.equal(result.results.length, 2);

    assert.ok(search);
    assert.equal(search.route, "property-search");
    assert.ok((search.count ?? 0) > 0);

    assert.ok(market);
    assert.equal(market.route, "agent-error");
    assert.equal(market.count, 0);

    assert.ok(
      result.reply.includes("could not be retrieved")
    );

    console.log("\n===== VALIDATION =====\n");

    console.log("PASS: Mixed-intent request survived");
    console.log("PASS: Property search results preserved");
    console.log("PASS: Market agent failure detected");
    console.log("PASS: User-friendly failure message");
    console.log("PASS: Combined response generated");

  } finally {
    // Always restore the original agent.
    agentRegistry.market = originalMarketAgent;

    clearSession(userId);

    console.log("Original market agent restored.");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Fault tolerance test failed:", error);
    process.exit(1);
  });
