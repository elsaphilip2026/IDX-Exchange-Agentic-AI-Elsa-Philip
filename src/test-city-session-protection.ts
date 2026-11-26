import assert from "node:assert/strict";
import { searchFromConversation } from "./conversational-search";
import { getSession, clearSession } from "./session-memory";

async function main() {
  const userId = "city-session-protection-test";

  clearSession(userId);

  try {
    console.log("\n===== SESSION PROTECTION TESTS =====\n");

    // Test 1: Reject greeting as city.
    let result = await searchFromConversation(userId, "Hello");

    assert.equal(result.needsCity, true);
    assert.equal(getSession(userId).city, undefined);

    console.log("PASS: Greeting not stored as city");

    // Test 2: Reject incomplete search as city.
    result = await searchFromConversation(
      userId,
      "Find me affordable homes"
    );

    assert.equal(result.needsCity, true);
    assert.equal(getSession(userId).city, undefined);

    console.log("PASS: Incomplete search not stored as city");

    // Test 3: Accept valid standalone city.
    result = await searchFromConversation(userId, "Irvine");

    assert.equal(getSession(userId).city, "Irvine");
    assert.ok(result.listings.length > 0);

    console.log("PASS: Valid standalone city accepted");

    // Test 4: Preserve city during budget follow-up.
    result = await searchFromConversation(
      userId,
      "Under $1200000"
    );

    assert.equal(getSession(userId).city, "Irvine");
    assert.equal(getSession(userId).maxPrice, 1200000);

    console.log("PASS: Budget and city preserved");

    // Test 5: Preserve filters during bedroom follow-up.
    result = await searchFromConversation(
      userId,
      "At least 3 bedrooms"
    );

    assert.equal(getSession(userId).city, "Irvine");
    assert.equal(getSession(userId).maxPrice, 1200000);
    assert.equal(getSession(userId).bedrooms, 3);

    console.log("PASS: Incremental filters preserved");

    // Test 6: Reject invalid city without overwriting session.
    result = await searchFromConversation(
      userId,
      "Find homes in Invalid City Name"
    );

    assert.equal(result.needsCity, true);
    assert.equal(getSession(userId).city, "Irvine");

    console.log("PASS: Invalid city cannot overwrite session");

    // Test 7: Verify pagination.
    result = await searchFromConversation(
      userId,
      "Show more"
    );

    assert.equal(getSession(userId).page, 2);
    assert.equal(getSession(userId).city, "Irvine");

    console.log("PASS: Pagination preserved");

    console.log("\n===== FINAL SESSION =====\n");

    const session = getSession(userId);

    console.log({
      city: session.city,
      maxPrice: session.maxPrice,
      bedrooms: session.bedrooms,
      page: session.page,
      savedListings: session.lastResults?.length
    });

    console.log("\nALL 7 SESSION PROTECTION TESTS PASSED");

  } finally {
    clearSession(userId);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Session protection test failed:", error);
    process.exit(1);
  });
