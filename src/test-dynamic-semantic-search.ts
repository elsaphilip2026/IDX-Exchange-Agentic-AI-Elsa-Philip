import assert from "node:assert/strict";
import { searchDynamicSemanticListings } from "./dynamic-semantic-search";

async function main() {
  console.log("\n===== DYNAMIC SEMANTIC SEARCH TEST =====\n");

  const start = Date.now();

  const result = await searchDynamicSemanticListings(
    "Homes with mountain views and spacious interiors",
    {
      city: "Irvine",
      maxPrice: 900000,
      bedrooms: 3,
    }
  );

  const properties = result.results;

  assert.ok(properties.length > 0);
  console.log("PASS: Semantic search returned properties");

  assert.ok(
    properties.every(p => p.L_City === "Irvine")
  );
  console.log("PASS: City filter respected");

  assert.ok(
    properties.every(p => Number(p.price) <= 900000)
  );
  console.log("PASS: Maximum budget respected");

  assert.ok(
    properties.every(p => Number(p.beds) >= 3)
  );
  console.log("PASS: Minimum bedrooms respected");

  assert.ok(
    properties.every(p =>
      Number.isFinite(p.score) &&
      p.score >= -1 &&
      p.score <= 1
    )
  );
  console.log("PASS: Valid cosine similarity scores");

  assert.ok(
    properties.every((p, i) =>
      i === 0 || properties[i - 1].score >= p.score
    )
  );
  console.log("PASS: Properties ranked by similarity");

  assert.ok(
    new Set(
      properties.map(p => String(p.L_ListingID))
    ).size === properties.length
  );
  console.log("PASS: No duplicate properties");

  assert.ok(result.candidatePool <= 100);
  console.log("PASS: Candidate pool limit respected");

  console.log("\nCandidate pool:", result.candidatePool);
  console.log("Results:", properties.length);
  console.log("Execution time:", Date.now() - start, "ms");

  console.log("\n===== RANKED PROPERTIES =====\n");

  console.table(
    properties.map(p => ({
      listingId: p.L_ListingID,
      address: p.L_Address,
      price: p.price,
      bedrooms: p.beds,
      similarity: p.score.toFixed(4),
    }))
  );

  console.log("\nALL 8 DYNAMIC SEMANTIC SEARCH TESTS PASSED");
}

main().then(() => {
  process.exit(0);
}).catch(error => {
  console.error(error);
  process.exit(1);
});
