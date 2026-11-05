
import { writeFile } from "node:fs/promises";
import { getLocalEmbedding } from "./local-embeddings";
import { getListingsForSemanticSearch } from "./semantic-listing-search";

async function main() {
  console.log("Loading Irvine MLS properties...");

  const listings = await getListingsForSemanticSearch("Irvine", 100);
  const cachedListings = [];

  for (const listing of listings) {
    console.log(`Generating embedding for ${listing.L_Address}...`);

    const embedding = await getLocalEmbedding(listing.listingText);

    cachedListings.push({
      ...listing,
      embedding,
    });
  }

  await writeFile(
    "data/irvine-embeddings.json",
    JSON.stringify(cachedListings, null, 2),
    "utf8"
  );

  console.log(`Saved ${cachedListings.length} property embeddings.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
