import assert from "node:assert/strict";
import { searchFromConversation } from "./conversational-search";
import { getSession, clearSession } from "./session-memory";

async function main() {
  const userId = "semantic-conversation-test";

  clearSession(userId);

  console.log("\n===== SEMANTIC CONVERSATION TEST =====\n");

  // Test 1: Initial descriptive search
  const first = await searchFromConversation(
    userId,
    "Find homes in Irvine with mountain views"
  );

  assert.equal(first.needsCity, false);
  assert.equal(first.semanticSearch, true);
  assert.equal(first.session.city, "Irvine");
  assert.equal(
    first.session.semanticDescription,
    "mountain views"
  );

  console.log("PASS: Initial descriptive search");

  // Test 2: Budget refinement
  const second = await searchFromConversation(
    userId,
    "Under $900000"
  );

  assert.equal(second.semanticSearch, true);
  assert.equal(second.session.maxPrice, 900000);
  assert.equal(
    second.session.semanticDescription,
    "mountain views"
  );
  assert.ok(second.listings.length > 0);
  assert.ok(
    second.listings.every(p => Number(p.price) <= 900000)
  );

  console.log("PASS: Budget refinement retains description");

  // Test 3: Bedroom refinement
  const third = await searchFromConversation(
    userId,
    "At least 3 bedrooms"
  );

  assert.equal(third.semanticSearch, true);
  assert.equal(third.session.bedrooms, 3);
  assert.equal(third.session.maxPrice, 900000);
  assert.equal(
    third.session.semanticDescription,
    "mountain views"
  );
  assert.ok(third.listings.length > 0);
  assert.ok(
    third.listings.every(p =>
      Number(p.beds) >= 3 &&
      Number(p.price) <= 900000
    )
  );

  console.log("PASS: Bedroom and budget preferences retained");

  // Test 4: Additional descriptive preference
  const fourth = await searchFromConversation(
    userId,
    "With spacious interiors"
  );

  assert.equal(
    fourth.session.semanticDescription,
    "mountain views, spacious"
  );
  assert.equal(fourth.semanticSearch, true);

  console.log("PASS: Additional description accumulated");

  // Test 5: Latest results stored in memory
  assert.deepEqual(
    getSession(userId).lastResults,
    fourth.listings
  );

  console.log("PASS: Ranked results saved in session memory");

  // Test 6: Pagination
  const fifth = await searchFromConversation(
    userId,
    "Show more"
  );

  assert.equal(fifth.session.page, 2);
  assert.equal(fifth.semanticSearch, true);
  assert.equal(
    fifth.session.semanticDescription,
    "mountain views, spacious"
  );

  const previousIds = new Set(
    fourth.listings.map(p => String(p.L_ListingID))
  );

  assert.ok(
    fifth.listings.every(
      p => !previousIds.has(String(p.L_ListingID))
    )
  );

  console.log("PASS: Semantic pagination retains preferences");

  // Test 7: Remove descriptive preferences
  const sixth = await searchFromConversation(
    userId,
    "Remove descriptive preferences"
  );

  assert.equal(
    sixth.session.semanticDescription,
    undefined
  );
  assert.notEqual(sixth.semanticSearch, true);
  assert.equal(sixth.session.maxPrice, 900000);
  assert.equal(sixth.session.bedrooms, 3);
  assert.equal(sixth.session.city, "Irvine");
  assert.equal(sixth.session.page, 1);

  console.log("PASS: Description removed; structured filters retained");

  // Test 8: Reset session
  await searchFromConversation(userId, "Reset");

  const finalSession = getSession(userId);

  assert.equal(finalSession.semanticDescription, undefined);
  assert.equal(finalSession.city, undefined);
  assert.equal(finalSession.maxPrice, undefined);
  assert.equal(finalSession.bedrooms, undefined);
  assert.equal(finalSession.lastResults, undefined);
  assert.equal(finalSession.page, 1);

  console.log("PASS: Session reset clears all preferences");

  console.log("\nALL 8 SEMANTIC CONVERSATION TESTS PASSED");
}

main().then(() => {
  process.exit(0);
}).catch(error => {
  console.error(error);
  process.exit(1);
});
