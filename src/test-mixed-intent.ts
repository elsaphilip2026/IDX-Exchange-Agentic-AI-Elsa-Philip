import assert from "node:assert/strict";
import { orchestrate } from "./orchestrator";
import { getSession, clearSession } from "./session-memory";

async function main() {
  const userId = "pasadena-mixed-test";

  clearSession(userId);

  const query =
    "Find me affordable homes in Pasadena and tell me whether prices are rising.";

  console.log("\n===== USER QUERY =====\n");
  console.log(query);

  const result = await orchestrate(query, userId);

  console.log("\n===== COMBINED RESPONSE =====\n");
  console.log(result.reply);

  console.log("\n===== AGENT RESULTS =====\n");

  console.table(
    result.results.map(agent => ({
      agent: agent.agent,
      route: agent.route,
      count: agent.count ?? 0,
    }))
  );

  console.log("\n===== SESSION MEMORY =====\n");

  const session = getSession(userId);

  console.log({
    city: session.city,
    maxPrice: session.maxPrice,
    page: session.page,
    savedListings: session.lastResults?.length ?? 0,
  });

  const search = result.results.find(
    agent => agent.agent === "search"
  );

  const market = result.results.find(
    agent => agent.agent === "market"
  );

  assert.equal(result.intent, "mixed");
  assert.ok(search);
  assert.ok(market);
  assert.equal(session.city?.toLowerCase(), "pasadena");
  assert.ok((search.count ?? 0) > 0);
  assert.ok((market.count ?? 0) > 0);
  assert.ok(market.reply.includes("Pasadena"));

  console.log("\n===== VALIDATION =====\n");
  console.log("PASS: Mixed-intent classification");
  console.log("PASS: Pasadena city recognition");
  console.log("PASS: Actual property listings");
  console.log("PASS: Actual market statistics");
  console.log("PASS: Session memory");

  console.log(
    `Total execution time: ${result.executionTimeMs} ms`
  );

  clearSession(userId);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Mixed-intent test failed:", error);
    process.exit(1);
  });
