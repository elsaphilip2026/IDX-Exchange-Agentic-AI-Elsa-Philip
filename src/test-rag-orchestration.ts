import assert from "node:assert/strict";
import { orchestrate } from "./orchestrator";
import { clearSession } from "./session-memory";

async function main() {
  const userId = "rag-orchestration-test";

  clearSession(userId);

  try {
    console.log("\n===== RAG ORCHESTRATION TESTS =====\n");

    // Test 1: Direct glossary lookup.
    const glossary = await orchestrate(
      "What does DOM mean?",
      userId
    );

    assert.equal(glossary.intent, "knowledge");
    assert.equal(glossary.route, "real-estate-glossary");

    console.log(glossary.reply);
    console.log("PASS: Direct glossary routing");

    // Test 2: Actual document retrieval.
    const schema = await orchestrate(
      "What columns are available in the california_sold table?",
      userId
    );

    assert.equal(schema.intent, "knowledge");
    assert.equal(schema.route, "rag-documentation");

    console.log("\n" + schema.reply);

    console.log("PASS: Automatic RAG routing");

    assert.ok(schema.reply.includes("california-sold-schema.txt"));

    console.log("PASS: Document source citation");

    const columns = schema.reply
      .split("\n")
      .filter(line => /^\s*•\s+/.test(line))
      .map(line => line.replace(/^\s*•\s+/, "").trim());

    assert.equal(columns.length, 46);
    assert.equal(new Set(columns).size, 46);

    console.log("PASS: 46 distinct columns returned");

    // Test 3: Information unavailable in source documents.
    const unavailable = await orchestrate(
      "What are the exact mortgage interest rates for every Irvine property in 2026?",
      userId
    );

    assert.equal(unavailable.intent, "knowledge");
    assert.equal(unavailable.route, "rag-documentation");

    console.log("\n" + unavailable.reply);

    assert.ok(
      /not available|not provided|not provide|not contain|cannot determine|not specified|do not contain|not include|unavailable/i
        .test(unavailable.reply)
    );

    console.log("PASS: Unavailable information acknowledged");

    // Test 4: Mixed property search and RAG.
    const mixed = await orchestrate(
      "Find homes in Irvine under $1.2M and explain the california_sold schema",
      userId
    );

    assert.equal(mixed.intent, "mixed");

    assert.ok(mixed.agents.includes("search"));
    assert.ok(mixed.agents.includes("knowledge"));

    const search = mixed.results.find(
      result => result.agent === "search"
    );

    const knowledge = mixed.results.find(
      result => result.agent === "knowledge"
    );

    assert.ok((search?.count ?? 0) > 0);
    assert.equal(knowledge?.route, "rag-documentation");
    assert.ok(knowledge?.reply.includes("california-sold-schema.txt"));

    console.log("\n" + mixed.reply);

    console.log("PASS: Mixed property search and RAG execution");

    console.log("\nALL 6 RAG ORCHESTRATION CHECKS PASSED");

  } finally {
    clearSession(userId);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("RAG orchestration test failed:", error);
    process.exit(1);
  });
