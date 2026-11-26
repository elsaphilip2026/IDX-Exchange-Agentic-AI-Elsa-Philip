import assert from "node:assert/strict";
import { orchestrate } from "./orchestrator";
import { agentRegistry } from "./agent-registry";
import { getSession, clearSession } from "./session-memory";

async function main() {
  const userId = "dependent-recommendation-test";

  clearSession(userId);

  const originalSearch = agentRegistry.search;
  const originalRecommend = agentRegistry.recommend;

  assert.ok(originalSearch);
  assert.ok(originalRecommend);

  try {
    console.log("\n===== RECOMMENDATION DEPENDENCY TESTS =====\n");

    // Establish previous search results.
    await orchestrate("Find homes in Pasadena", userId);

    assert.equal(getSession(userId).city, "Pasadena");

    console.log("PASS: Previous search context established");

    let recommendationCalls = 0;

    agentRegistry.recommend = async context => {
      recommendationCalls++;

      const session = getSession(context.userId);

      assert.equal(session.city, "Irvine");
      assert.equal(session.maxPrice, 1200000);
      assert.equal(session.bedrooms, 3);
      assert.ok(session.lastResults?.length);

      assert.ok(
        session.lastResults.every(
          listing =>
            listing.L_City.trim().toLowerCase() === "irvine"
        )
      );

      console.log("PASS: Recommendation receives fresh Irvine listings");

      return originalRecommend(context);
    };

    // Search and recommend in a single request.
    const result = await orchestrate(
      "Find homes in Irvine under $1.2M with at least 3 bedrooms and recommend properties similar to the fifth property",
      userId
    );

    assert.equal(result.intent, "mixed");

    assert.deepEqual(
      result.agents,
      ["search", "recommend"]
    );

    console.log("PASS: Search and recommendation intents detected");

    const search = result.results.find(
      item => item.agent === "search"
    );

    const recommendation = result.results.find(
      item => item.agent === "recommend"
    );

    assert.ok((search?.count ?? 0) > 0);
    assert.equal(recommendationCalls, 1);
    assert.equal(recommendation?.route, "recommendation-engine");

    console.log("PASS: Recommendation executed after search");

    console.log("\n===== RECOMMENDATION RESPONSE =====\n");
    console.log(recommendation?.reply);

    if ((recommendation?.count ?? 0) > 0) {
      console.log("\nPASS: Actual recommendations retrieved");
    } else {
      console.log(
        "\nNOTE: Recommendation executed, but no recommendations were returned. Check embedding cache coverage."
      );
    }

    // Simulate a failed search.
    agentRegistry.search = async () => {
      throw new Error("Simulated search failure");
    };

    const failed = await orchestrate(
      "Find homes in Pasadena and recommend similar properties",
      userId
    );

    assert.equal(
      failed.results.find(
        item => item.agent === "search"
      )?.route,
      "agent-error"
    );

    assert.equal(
      failed.results.find(
        item => item.agent === "recommend"
      )?.route,
      "dependency-skipped"
    );

    assert.equal(recommendationCalls, 1);

    console.log("\nPASS: Failed search skips recommendation");
    console.log("PASS: Previous listings are not reused");

    console.log("\nALL 6 RECOMMENDATION DEPENDENCY CHECKS PASSED");

  } finally {
    agentRegistry.search = originalSearch;
    agentRegistry.recommend = originalRecommend;

    clearSession(userId);

    console.log("Original agents restored.");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Recommendation dependency test failed:", error);
    process.exit(1);
  });
