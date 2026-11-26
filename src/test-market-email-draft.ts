import assert from "node:assert/strict";
import { emailDraftAgent } from "./email-draft-agent";
import { clearSession } from "./session-memory";

async function main() {
  const userId = "market-email-test-user";

  clearSession(userId);

  const result = await emailDraftAgent(
    "Draft an email summarizing the Irvine housing market",
    userId
  );

  console.log("\n===== MARKET EMAIL DRAFT =====\n");
  console.log(result.reply);
  console.log("\n===== VALIDATION =====\n");

  assert.equal(
    result.subject,
    "Housing Market Summary - Irvine"
  );

  assert.ok(result.count > 0);
  assert.ok(result.body.includes("Median sold price"));
  assert.ok(result.body.includes("Average days on market"));
  assert.ok(result.body.includes("List-to-close ratio"));
  assert.ok(result.body.includes("MONTHLY PRICE TRENDS"));
  assert.ok(result.body.includes("DATA COVERAGE AND LIMITATIONS"));
  assert.ok(result.reply.includes("No email has been sent"));

  console.log("PASS: Market email generated successfully.");
  console.log(`Residential sales analyzed: ${result.count}`);

  clearSession(userId);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Market email test failed:", error);
    process.exit(1);
  });
