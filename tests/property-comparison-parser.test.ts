import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parsePropertyComparison
} from "../src/property-comparison-parser";

const validQueries = [
  ["Compare properties 1 and 2", 1, 2],
  ["Compare property 1 with property 3", 1, 3],
  ["Compare listings 2 vs 4", 2, 4],
  ["Compare 1 versus 5", 1, 5],
  ["Compare 1 and 2", 1, 2],
  [
    "Compare properties 1 and 2 and tell me whether prices are rising",
    1,
    2
  ],
] as const;

for (const [query, first, second] of validQueries) {
  test(query, () => {
    assert.deepEqual(
      parsePropertyComparison(query),
      {
        firstNumber: first,
        secondNumber: second,
      }
    );
  });
}

const unrelatedQueries = [
  "Find homes in Irvine",
  "Compare housing markets in Irvine and Pasadena",
  "Recommend similar properties",
  "Under $900000",
  "Compare properties",
];

for (const query of unrelatedQueries) {
  test(`Ignore: ${query}`, () => {
    assert.equal(
      parsePropertyComparison(query),
      null
    );
  });
}
