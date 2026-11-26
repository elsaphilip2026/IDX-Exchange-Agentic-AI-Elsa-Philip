import { classifyIntent } from "./intent-classifier";
import { parsePropertyComparison } from "./property-comparison-parser";

export function hasSearchComparisonConflict(
  query: string
): boolean {
  if (!parsePropertyComparison(query)) {
    return false;
  }

  // Remove numbered comparison instructions before checking
  // whether the remaining text requests a property search.
  const remaining = query.replace(
    /\bcompare\s+(?:property|properties|listing|listings)?\s*\d+\s+(?:and|with|vs\.?|versus)\s+(?:property|properties|listing|listings)?\s*\d+\b/gi,
    ""
  );

  const clauses = remaining
    .split(/\s*(?:[;.!?]+|,?\s+\b(?:and then|then|and)\b\s*)\s*/i)
    .map(clause => clause.trim())
    .filter(Boolean);

  return clauses.some(clause =>
    classifyIntent(clause).agents.includes("search")
  );
}
