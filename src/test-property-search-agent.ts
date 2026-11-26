import assert from "node:assert/strict";
import { executeAgent } from "./agent-registry";
import { getSession, clearSession } from "./session-memory";

async function main() {
  const userId = "property-agent-test-user";

  clearSession(userId);

  const messages = [
    "Find homes in Irvine",
    "Under $1200000",
    "At least 3 bedrooms",
    "Show more",
  ];

  for (const message of messages) {
    console.log("\n================================");
    console.log("USER:", message);
    console.log("================================\n");

    const result = await executeAgent("search", {
      query: message,
      userId,
    });

    console.log(result.reply);

    assert.equal(result.agent, "search");
    assert.equal(result.route, "property-search");

    console.log("\nSESSION MEMORY:");

    const session = getSession(userId);

    console.log({
      city: session.city,
      maxPrice: session.maxPrice,
      bedrooms: session.bedrooms,
      page: session.page,
      conversationStep: session.conversationStep,
    });

    assert.equal(session.city?.toLowerCase(), "irvine");

    if (message === "Under $1200000") {
      assert.equal(session.maxPrice, 1200000);
    }

    if (message === "At least 3 bedrooms") {
      assert.equal(session.maxPrice, 1200000);
      assert.equal(session.bedrooms, 3);
      assert.ok((result.count ?? 0) > 0);
    }

    if (message === "Show more") {
      assert.equal(session.page, 2);
      assert.equal(session.maxPrice, 1200000);
      assert.equal(session.bedrooms, 3);
    }
  }

  console.log("\n===== VALIDATION =====\n");
  console.log("PASS: Property Search Agent");
  console.log("PASS: Conversational memory");
  console.log("PASS: Incremental search filters");
  console.log("PASS: Pagination");

  clearSession(userId);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Property Search Agent test failed:", error);
    process.exit(1);
  });
