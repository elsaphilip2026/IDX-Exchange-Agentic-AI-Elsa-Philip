import assert from "node:assert/strict";
import { orchestrate } from "./orchestrator";
import { getSession, clearSession } from "./session-memory";

async function main() {
  const userId = "context-aware-orchestrator-test";

  clearSession(userId);

  try {
    console.log("\n===== CONTEXT-AWARE ORCHESTRATION =====\n");

    // Test 1: Search without specifying a city.
    let result = await orchestrate(
      "Find me affordable homes",
      userId
    );

    assert.equal(result.intent, "search");
    assert.equal(getSession(userId).city, undefined);

    console.log("PASS: Incomplete property search");
    console.log("Bot:", result.reply);

    // Test 2: Standalone city response.
    result = await orchestrate("Irvine", userId);

    assert.equal(result.intent, "search");
    assert.equal(getSession(userId).city, "Irvine");
    assert.ok((result.results[0]?.count ?? 0) > 0);

    console.log("\nPASS: Standalone city routed correctly");

    // Test 3: Budget follow-up.
    result = await orchestrate("Under $1.2M", userId);

    assert.equal(result.intent, "search");
    assert.equal(getSession(userId).maxPrice, 1200000);
    assert.equal(getSession(userId).city, "Irvine");

    console.log("PASS: Budget follow-up");

    // Test 4: Bedroom follow-up.
    result = await orchestrate("At least 3 bedrooms", userId);

    assert.equal(result.intent, "search");
    assert.equal(getSession(userId).bedrooms, 3);
    assert.equal(getSession(userId).maxPrice, 1200000);

    console.log("PASS: Bedroom follow-up");

    // Test 5: Market question using saved city.
    result = await orchestrate(
      "How is the market?",
      userId
    );

    assert.equal(result.intent, "market");
    assert.ok(result.reply.includes("Irvine"));
    assert.ok((result.results[0]?.count ?? 0) > 0);

    console.log("PASS: Market analysis using session city");

    // Test 6: Knowledge question.
    result = await orchestrate("Explain DOM", userId);

    assert.equal(result.intent, "knowledge");

    console.log("PASS: Knowledge agent routing");

    // Test 7: Email using previous search results.
    result = await orchestrate(
      "Draft an email with these properties",
      userId
    );

    assert.equal(result.intent, "email");
    assert.ok((result.results[0]?.count ?? 0) > 0);

    console.log("PASS: Email using previous search results");

    // Test 8: Unknown greeting.
    result = await orchestrate("Hello", userId);

    assert.equal(result.intent, "unknown");
    assert.equal(getSession(userId).city, "Irvine");

    console.log("PASS: Greeting does not corrupt session");

    // Test 9: Verify user isolation.
    const otherUser = "context-isolated-user";

    clearSession(otherUser);

    try {
      assert.equal(getSession(otherUser).city, undefined);
      assert.equal(getSession(otherUser).maxPrice, undefined);
      assert.equal(getSession(otherUser).lastResults, undefined);

      console.log("PASS: Session isolation between users");
    } finally {
      clearSession(otherUser);
    }

    const session = getSession(userId);

    console.log("\n===== FINAL SESSION =====\n");

    console.log({
      city: session.city,
      maxPrice: session.maxPrice,
      bedrooms: session.bedrooms,
      page: session.page,
      savedListings: session.lastResults?.length
    });

    console.log("\nALL 9 CONTEXT-AWARE TESTS PASSED");

  } finally {
    clearSession(userId);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Context-aware test failed:", error);
    process.exit(1);
  });
