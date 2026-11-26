import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { recommendSimilarListings } from "./recommendation-engine";

async function main() {
  console.log("\n===== DYNAMIC RECOMMENDATION TEST =====\n");

  const targetId = "1177293155";

  const cache = JSON.parse(
    await readFile("data/irvine-embeddings.json", "utf8")
  );

  assert.ok(
    !cache.some(
      (p: any) => String(p.L_ListingID) === targetId
    )
  );

  console.log("PASS: Reference property is outside the original cache");

  const start = Date.now();

  const result = await recommendSimilarListings(
    targetId,
    5,
    {
      city: "Irvine",
      maxPrice: 900000,
      bedrooms: 3,
    }
  );

  console.log("Reference listing:", result.targetListingId);
  console.log("Candidate pool:", result.candidatePool);
  console.log("Recommendations:", result.recommendations.length);
  console.log("Execution time:", Date.now() - start, "ms");

  assert.ok(result.recommendations.length > 0);
  console.log("PASS: Uncached reference property supported");

  assert.ok(
    result.recommendations.every(p => p.price <= 900000)
  );
  console.log("PASS: Maximum budget respected");

  assert.ok(
    result.recommendations.every(p => p.bedrooms >= 3)
  );
  console.log("PASS: Minimum bedrooms respected");

  assert.ok(
    result.recommendations.every(p => p.city === "Irvine")
  );
  console.log("PASS: City preference respected");

  assert.ok(
    result.recommendations.every(p => p.listingId !== targetId)
  );
  console.log("PASS: Reference property excluded");

  assert.ok(
    result.recommendations.every(
      p => Number.isFinite(p.score) &&
           p.score >= 0 &&
           p.score <= 100
    )
  );
  console.log("PASS: Valid similarity scores");

  assert.ok(
    result.recommendations.every(p => p.comps != null)
  );
  console.log("PASS: Comparable-sales validation returned");

  console.log("\n===== RECOMMENDATIONS =====\n");

  console.log(
    JSON.stringify(result.recommendations, null, 2)
  );

  console.log("\nALL 8 DYNAMIC RECOMMENDATION TESTS PASSED");
}

main().then(() => {
  process.exit(0);
}).catch(error => {
  console.error(error);
  process.exit(1);
});
