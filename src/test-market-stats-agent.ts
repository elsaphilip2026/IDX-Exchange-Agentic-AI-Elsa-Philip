import assert from "node:assert/strict";
import { executeAgent } from "./agent-registry";

async function main() {
  const result = await executeAgent("market", {
    query: "Are home prices rising in Irvine?",
    userId: "market-agent-test-user",
  });

  console.log("\n===== MARKET STATISTICS AGENT =====\n");
  console.log(result.reply);

  console.log("\n===== VALIDATION =====\n");

  assert.equal(result.agent, "market");
  assert.equal(result.route, "market-statistics");
  assert.ok((result.count ?? 0) > 0);
  assert.ok(result.reply.includes("Irvine"));
  assert.ok(result.reply.includes("Median sold price"));
  assert.ok(result.reply.includes("PRICE TREND ASSESSMENT"));
  assert.ok(result.reply.includes("DATA COVERAGE"));
  assert.ok(result.reply.includes("DATA LIMITATIONS"));

  console.log("PASS: Market Statistics Agent executed successfully.");
  console.log(`Residential sales analyzed: ${result.count}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Market Statistics Agent test failed:", error);
    process.exit(1);
  });
