import assert from "node:assert/strict";
import { orchestrate } from "./orchestrator";
import { searchFromConversation } from "./conversational-search";
import { getSession, clearSession } from "./session-memory";

async function main() {
  const userId = "city-switching-test";

  clearSession(userId);

  try {
    console.log("\n===== CITY SWITCHING TESTS =====\n");

    await orchestrate("Find homes in Irvine", userId);

    assert.equal(getSession(userId).city, "Irvine");

    console.log("PASS: Initial city selected");

    await orchestrate("Under $1.2M", userId);
    await orchestrate("At least 3 bedrooms", userId);

    assert.equal(getSession(userId).maxPrice, 1200000);
    assert.equal(getSession(userId).bedrooms, 3);

    console.log("PASS: Budget and bedroom filters saved");

    await orchestrate("Show more", userId);

    assert.equal(getSession(userId).page, 2);

    console.log("PASS: Pagination working");

    const result = await orchestrate("Pasadena", userId);

    assert.equal(result.intent, "search");
    assert.equal(getSession(userId).city, "Pasadena");

    console.log("PASS: Standalone city switching");

    const session = getSession(userId);

    assert.equal(session.maxPrice, 1200000);
    assert.equal(session.bedrooms, 3);

    console.log("PASS: Existing filters preserved");

    assert.equal(session.page, 1);

    console.log("PASS: Pagination reset after city change");

    assert.ok(session.lastResults?.length);

    assert.ok(
      session.lastResults.every(
        listing =>
          listing.L_City.trim().toLowerCase() === "pasadena"
      )
    );

    console.log("PASS: Listings belong to the new city");

    const market = await orchestrate(
      "How is the market?",
      userId
    );

    assert.equal(market.intent, "market");
    assert.ok(market.reply.includes("Pasadena"));
    assert.ok((market.results[0]?.count ?? 0) > 0);

    console.log("PASS: Market agent uses updated city");

    console.log("\n===== SESSION BEFORE RESET =====\n");

    console.log({
      city: session.city,
      maxPrice: session.maxPrice,
      bedrooms: session.bedrooms,
      page: session.page,
      savedListings: session.lastResults?.length
    });

    await searchFromConversation(userId, "Reset");

    const resetSession = getSession(userId);

    assert.equal(resetSession.city, undefined);
    assert.equal(resetSession.maxPrice, undefined);
    assert.equal(resetSession.bedrooms, undefined);
    assert.equal(resetSession.lastResults, undefined);
    assert.equal(resetSession.page, 1);

    console.log("\nPASS: Search-layer reset clears session");

    console.log("\nALL 9 CITY SWITCHING TESTS PASSED");

  } finally {
    clearSession(userId);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("City switching test failed:", error);
    process.exit(1);
  });
