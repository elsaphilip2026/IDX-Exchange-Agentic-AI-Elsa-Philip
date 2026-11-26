import { test } from "node:test";
import assert from "node:assert/strict";

import {
  hasSearchComparisonConflict,
} from "../src/search-comparison-conflict";

const conflictingQueries = [
  "Find homes in Pasadena and compare properties 1 and 2",
  "Find homes in Pasadena, then compare properties 1 and 2",
  "Find homes in Irvine and then compare properties 2 and 3",
  "Under $900k and compare properties 1 and 2",
  "At least 3 bedrooms and compare properties 1 and 2",
  "Show more and compare properties 1 and 2",
  "Compare properties 1 and 2 and find homes in Pasadena",
  "Find homes in Irvine; compare properties 1 and 2",
  "Find spacious homes in Irvine and compare properties 1 and 2",
  "Find homes in Pasadena and compare properties 1 and 2 and draft an email",
];

const validQueries = [
  "Compare properties 1 and 2",
  "Compare properties 2 and 3",
  "Compare property 1 with property 2",
  "Compare listings 1 vs 2",
  "Compare properties 2 and 3 and draft an email",
  "Compare properties 2 and 3 and tell me whether prices are rising",
  "Compare properties 2 and 3 and recommend similar properties",
  "Compare properties 2 and 3 and recommend properties similar to property 3",
  "Find homes in Irvine under $1200000",
  "Find affordable homes in Pasadena and tell me whether prices are rising",
  "Show more",
  "Reset",
];

for (const query of conflictingQueries) {
  test(`Blocks conflicting request: ${query}`, () => {
    assert.equal(
      hasSearchComparisonConflict(query),
      true
    );
  });
}

for (const query of validQueries) {
  test(`Allows valid request: ${query}`, () => {
    assert.equal(
      hasSearchComparisonConflict(query),
      false
    );
  });
}
