import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyIntent } from "../src/intent-classifier";
import { decomposeQuery } from "../src/query-decomposer";

const cases = [
  ["Find homes in Irvine with mountain views", "search"],
  ["Modern homes in Pasadena", "search"],
  ["Mountain views", "search"],
  ["With spacious interiors", "search"],
  ["Under $900000", "search"],
  ["At least 3 bedrooms", "search"],
  ["Remove descriptive preferences", "search"],
  ["Clear descriptive filters", "search"],
  ["Show more", "search"],
  ["Recommend similar modern homes", "recommend"],
  ["What is DOM?", "knowledge"],
  ["What is a luxury home?", "unknown"],
  ["Draft an email about modern homes", "email"],
  ["Are prices rising in Pasadena?", "market"],
] as const;

for (const [query, expected] of cases) {
  test(query, () => {
    assert.equal(
      classifyIntent(query).intent,
      expected
    );
  });
}

test("Mixed semantic search and market analysis", () => {
  const query =
    "Find homes in Irvine with mountain views and tell me whether prices are rising";

  const result = classifyIntent(query);

  assert.equal(result.intent, "mixed");
  assert.deepEqual(result.agents, ["search", "market"]);

  const tasks = decomposeQuery(query, result.agents);

  assert.equal(tasks.length, 2);

  const search = tasks.find(t => t.agent === "search");
  const market = tasks.find(t => t.agent === "market");

  assert.ok(search);
  assert.ok(market);

  assert.match(search.query, /mountain views/i);
  assert.doesNotMatch(search.query, /prices are rising/i);
  assert.match(market.query, /prices are rising/i);
  assert.match(market.query, /Irvine/i);
});
