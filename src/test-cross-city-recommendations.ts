import assert from "node:assert/strict";
import { recommendSimilarListings } from "./recommendation-engine";
import { searchActiveListings } from "./listing-search";

async function main() {
  console.log("\n===== CROSS-CITY RECOMMENDATION TEST =====\n");

  const filters = {
    city: "Pasadena",
    maxPrice: 600000,
  };

  const listings = await searchActiveListings(
    filters,
    1,
    5
  );

  assert.ok(listings.length >= 2);

  const targetId = String(listings[0].L_ListingID);

  console.log("Reference property:", listings[0].L_Address);
  console.log("Reference listing ID:", targetId);

  const start = Date.now();

  const result = await recommendSimilarListings(
    targetId,
    5,
    filters
  );

  assert.ok(result.recommendations.length > 0);
  console.log("PASS: Recommendations outside Irvine supported");

  assert.ok(
    result.recommendations.every(
      p => p.city === "Pasadena"
    )
  );
  console.log("PASS: Pasadena city preference respected");

  assert.ok(
    result.recommendations.every(
      p => p.price <= 600000
    )
  );
  console.log("PASS: Maximum budget respected");

  assert.ok(
    result.recommendations.every(
      p => p.listingId !== targetId
    )
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

  console.log("\nCandidate pool:", result.candidatePool);
  console.log("Recommendations:", result.recommendations.length);
  console.log("Execution time:", Date.now() - start, "ms");

  console.log(
    JSON.stringify(result.recommendations, null, 2)
  );

  console.log("\nALL 6 CROSS-CITY RECOMMENDATION TESTS PASSED");
}

main().then(() => {
  process.exit(0);
}).catch(error => {
  console.error(error);
  process.exit(1);
});
