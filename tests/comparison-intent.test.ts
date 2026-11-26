import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyIntent } from "../src/intent-classifier";
import { decomposeQuery } from "../src/query-decomposer";

const cases = [
  ["Compare properties 1 and 2", "search"],
  ["Compare property 1 with property 3", "search"],
  ["Compare listings 2 vs 4", "search"],
  ["Compare 1 versus 5", "search"],
  ["Find homes in Irvine", "search"],
  ["Recommend similar properties", "recommend"],
  ["What is DOM?", "knowledge"],
  ["Compare properties", "unknown"],
] as const;

for (const [query, expected] of cases) {
  test(query, () => {
    assert.equal(
      classifyIntent(query).intent,
      expected
    );
  });
}

test("Comparison and market analysis", () => {
  const query =
    "Compare properties 1 and 2 and tell me whether prices are rising";

  const result = classifyIntent(query);

  assert.equal(result.intent, "mixed");
  assert.deepEqual(result.agents, ["search", "market"]);

  const tasks = decomposeQuery(query, result.agents);

  assert.equal(tasks.length, 2);

  assert.equal(
    tasks.find(t => t.agent === "search")?.query,
    "Compare properties 1 and 2"
  );

  assert.equal(
    tasks.find(t => t.agent === "market")?.query,
    "tell me whether prices are rising"
  );
});

test("Comparison and email drafting", () => {
  const result = classifyIntent(
    "Compare properties 1 and 2 and draft an email"
  );

  assert.equal(result.intent, "mixed");
  assert.deepEqual(result.agents, ["search", "email"]);
});

test("Comparison and knowledge request", () => {
  const result = classifyIntent(
    "Compare properties 1 and 2 and explain DOM"
  );

  assert.equal(result.intent, "mixed");
  assert.deepEqual(result.agents, ["search", "knowledge"]);
});
