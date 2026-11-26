import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyIntent } from "../src/intent-classifier";

const cases = [
  {
    name: "Budget follow-up",
    query: "Under $1.2 million",
    expected: "search",
  },
  {
    name: "Bedroom follow-up",
    query: "At least 3 bedrooms",
    expected: "search",
  },
  {
    name: "Pool preference",
    query: "With a pool",
    expected: "search",
  },
  {
    name: "Bathroom preference",
    query: "2 bathrooms",
    expected: "search",
  },
  {
    name: "Pagination - Show more",
    query: "Show more",
    expected: "search",
  },
  {
    name: "Pagination - Next page",
    query: "Next page",
    expected: "search",
  },
  {
    name: "Inventory definition",
    query: "Define inventory",
    expected: "knowledge",
  },
  {
    name: "Average DOM statistics",
    query: "What is the average days on market in Irvine?",
    expected: "market",
  },
  {
    name: "DOM property filter",
    query: "Find homes with less than 30 days on market",
    expected: "search",
  },
  {
    name: "Market price direction",
    query: "Are home prices rising in Pasadena?",
    expected: "market",
  },
  {
    name: "Market email drafting",
    query: "Draft an email summarizing the Irvine housing market",
    expected: "email",
  },
  {
    name: "Ordinal property recommendation",
    query: "Recommend properties similar to the fifth listing",
    expected: "recommend",
  },
];

for (const item of cases) {
  test(item.name, () => {
    const result = classifyIntent(item.query);

    assert.equal(result.intent, item.expected);
    assert.deepEqual(result.agents, [item.expected]);
  });
}

test("Week 9 handbook mixed-intent example", () => {
  const result = classifyIntent(
    "Find me affordable homes in Pasadena and tell me whether prices are rising."
  );

  assert.equal(result.intent, "mixed");
  assert.deepEqual(result.agents, ["search", "market"]);
});

test("Mixed property search and knowledge", () => {
  const result = classifyIntent(
    "Find homes in Irvine and explain DOM"
  );

  assert.equal(result.intent, "mixed");
  assert.deepEqual(result.agents, ["search", "knowledge"]);
});

test("Unknown greeting", () => {
  const result = classifyIntent("Good morning");

  assert.equal(result.intent, "unknown");
  assert.deepEqual(result.agents, []);
});
