import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyIntent } from "../src/intent-classifier";

const testCases = [
  {
    name: "Property search",
    query: "Find homes in Irvine under $1.2 million",
    intent: "search",
    agents: ["search"],
  },
  {
    name: "Market statistics",
    query: "What is the median sold price in Irvine?",
    intent: "market",
    agents: ["market"],
  },
  {
    name: "Property recommendation",
    query: "Show me similar properties to the first listing",
    intent: "recommend",
    agents: ["recommend"],
  },
  {
    name: "Knowledge - DOM",
    query: "What does DOM mean in real estate?",
    intent: "knowledge",
    agents: ["knowledge"],
  },
  {
    name: "Knowledge - Database schema",
    query: "What columns are available in the california_sold table?",
    intent: "knowledge",
    agents: ["knowledge"],
  },
  {
    name: "Knowledge - List-to-close ratio",
    query: "What is the list-to-close ratio?",
    intent: "knowledge",
    agents: ["knowledge"],
  },
  {
    name: "Knowledge - Mortgage rates",
    query: "What are the exact mortgage interest rates for every Irvine property in 2026?",
    intent: "knowledge",
    agents: ["knowledge"],
  },
  {
    name: "Email drafting",
    query: "Draft an email summarizing these properties",
    intent: "email",
    agents: ["email"],
  },
  {
    name: "Mixed - Search and market",
    query: "Find me affordable homes in Pasadena and tell me whether prices are rising.",
    intent: "mixed",
    agents: ["search", "market"],
  },
  {
    name: "Mixed - Search and knowledge",
    query: "Find homes in Irvine under $1 million and explain what DOM means.",
    intent: "mixed",
    agents: ["search", "knowledge"],
  },
  {
    name: "Unknown intent",
    query: "Hello",
    intent: "unknown",
    agents: [],
  },
];

for (const item of testCases) {
  test(item.name, () => {
    const result = classifyIntent(item.query);

    assert.equal(result.intent, item.intent);
    assert.deepEqual(result.agents, item.agents);
  });
}
