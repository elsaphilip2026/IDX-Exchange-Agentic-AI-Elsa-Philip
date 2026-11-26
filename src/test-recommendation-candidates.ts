import assert from "node:assert/strict";
import { searchActiveListings } from "./listing-search";

async function main() {
  console.log("\n===== RECOMMENDATION CANDIDATE TEST =====\n");

  const filters = {
    city: "Irvine",
    maxPrice: 900000,
    bedrooms: 3,
  };

  const candidates = await searchActiveListings(
    filters,
    1,
    100,
    true
  );

  assert.ok(candidates.length > 0);
  assert.ok(candidates.length <= 100);

  console.log("PASS: Candidate retrieval successful");
  console.log("Candidates found:", candidates.length);

  assert.ok(
    candidates.every(p => Number(p.price) <= 900000)
  );
  console.log("PASS: Maximum budget respected");

  assert.ok(
    candidates.every(p => Number(p.beds) >= 3)
  );
  console.log("PASS: Bedroom preference respected");

  assert.ok(
    candidates.every(p => p.L_City === "Irvine")
  );
  console.log("PASS: City preference respected");

  assert.ok(
    candidates.every(p => "L_Remarks" in p)
  );
  console.log("PASS: Property descriptions included");

  const regular = await searchActiveListings(
    filters,
    1,
    5
  );

  assert.ok(regular.length > 0);

  assert.ok(
    regular.every(p => !("L_Remarks" in p))
  );
  console.log("PASS: Existing search response unchanged");

  console.log("\nALL 6 CANDIDATE RETRIEVAL TESTS PASSED");
}

main().then(() => {
  process.exit(0);
}).catch(error => {
  console.error(error);
  process.exit(1);
});
