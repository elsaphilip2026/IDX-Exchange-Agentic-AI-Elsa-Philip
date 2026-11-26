import assert from "node:assert/strict";
import { executeAgent } from "./agent-registry";
import { getSession, clearSession } from "./session-memory";

async function main() {
  const userId = "recommendation-agent-test-user";

  clearSession(userId);

  console.log("\n===== PROPERTY SEARCH =====\n");

  const search = await executeAgent("search", {
    query: "Find homes in Irvine under $1200000 with at least 3 bedrooms",
    userId,
  });

  console.log(search.reply);

  assert.ok((search.count ?? 0) > 0);

  const session = getSession(userId);
  const selectedListing = session.lastResults?.[4];

  assert.ok(selectedListing);

  console.log("\n===== SELECTED PROPERTY =====\n");
  console.log("Listing ID:", selectedListing.L_ListingID);
  console.log("Address:", selectedListing.L_Address);

  console.log("\n===== RECOMMENDATION AGENT =====\n");

  const result = await executeAgent("recommend", {
    query: "Recommend properties similar to the fifth listing",
    userId,
  });

  console.log(result.reply);

  assert.equal(result.agent, "recommend");
  assert.equal(result.route, "recommendation-engine");
  assert.ok((result.count ?? 0) > 0);

  assert.ok(
    result.reply.includes(
      String(selectedListing.L_ListingID)
    )
  );

  console.log("\n===== VALIDATION =====\n");
  console.log("PASS: Recommendation Agent");
  console.log("PASS: Previous listing retrieved from session");
  console.log("PASS: Similar property recommendations");
  console.log(`Recommendations generated: ${result.count}`);

  clearSession(userId);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Recommendation Agent test failed:", error);
    process.exit(1);
  });
