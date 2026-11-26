import assert from "node:assert/strict";
import { orchestrate } from "./orchestrator";
import { getSession, clearSession } from "./session-memory";

async function main() {
  const userId = "affordability-test";

  clearSession(userId);

  try {
    console.log("\n===== AFFORDABILITY TESTS =====\n");

    // Test 1: Exact Week 9 handbook example.
    const result = await orchestrate(
      "Find me affordable homes in Pasadena and tell me whether prices are rising.",
      userId
    );

    assert.equal(result.intent, "mixed");

    assert.deepEqual(
      result.agents,
      ["search", "market"]
    );

    console.log("PASS: Handbook mixed-intent query");

    const search = result.results.find(
      item => item.agent === "search"
    );

    const market = result.results.find(
      item => item.agent === "market"
    );

    assert.ok(search);
    assert.ok((search.count ?? 0) > 0);

    console.log("PASS: Property listings retrieved");

    assert.equal(getSession(userId).maxPrice, undefined);

    console.log("PASS: No arbitrary budget assigned");

    assert.ok(
      search.reply.includes(
        "You have not specified a maximum budget"
      )
    );

    assert.ok(
      search.reply.includes(
        "What is your preferred maximum purchase price?"
      )
    );

    console.log("PASS: Affordability clarification displayed");

    assert.ok(market);
    assert.ok((market.count ?? 0) > 0);
    assert.ok(market.reply.includes("Pasadena"));

    console.log("PASS: Market analysis provided");

    console.log("\n===== HANDBOOK EXAMPLE RESPONSE =====\n");

    console.log(result.reply);

    // Test 2: User supplies a maximum budget.
    await orchestrate("Under $1.2M", userId);

    assert.equal(getSession(userId).maxPrice, 1200000);
    assert.equal(getSession(userId).city, "Pasadena");

    console.log("\nPASS: Follow-up budget saved");

    // Test 3: Affordable search with remembered budget.
    const refined = await orchestrate(
      "Find affordable homes in Pasadena",
      userId
    );

    assert.ok((refined.results[0]?.count ?? 0) > 0);

    assert.ok(
      refined.reply.includes(
        "maximum budget of $1,200,000"
      )
    );

    assert.equal(getSession(userId).maxPrice, 1200000);

    console.log("PASS: Remembered budget respected");

    const listings = getSession(userId).lastResults;

    assert.ok(listings?.length);

    assert.ok(
      listings.every(
        listing => Number(listing.price) <= 1200000
      )
    );

    console.log("PASS: All returned listings satisfy budget");

    // Test 4: Regular property search.
    clearSession(userId);

    const regular = await orchestrate(
      "Find homes in Irvine",
      userId
    );

    assert.ok((regular.results[0]?.count ?? 0) > 0);

    assert.ok(
      !regular.reply.includes("Affordability note:")
    );

    console.log("PASS: Regular search remains unchanged");

    console.log("\nALL 9 AFFORDABILITY CHECKS PASSED");

  } finally {
    clearSession(userId);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Affordability test failed:", error);
    process.exit(1);
  });
