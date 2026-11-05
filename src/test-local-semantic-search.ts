import { getLocalEmbedding } from "./local-embeddings";
import { getListingsForSemanticSearch } from "./semantic-listing-search";
import { cosineSimilarity } from "./vector-similarity";

async function main() {
  const description =
    "Beautiful modern home with mountain views and a spacious backyard";

  console.log("Loading Irvine properties...");
  const listings = await getListingsForSemanticSearch("Irvine", 10);

  console.log(`Found ${listings.length} properties.`);
  console.log("Generating genuine AI embeddings...");

  const queryEmbedding = await getLocalEmbedding(description);

  const results = [];

  for (const listing of listings) {
    const listingEmbedding = await getLocalEmbedding(listing.listingText);

    const score = cosineSimilarity(
      queryEmbedding,
      listingEmbedding
    );

    results.push({
      address: listing.L_Address,
      price: listing.L_SystemPrice,
      bedrooms: listing.L_Keyword2,
      bathrooms: listing.LM_Dec_3,
      sqft: listing.LM_Int2_3,
      score,
    });
  }

  results.sort((a, b) => b.score - a.score);

  console.log("\nTop 5 AI semantic matches:");

  for (const property of results.slice(0, 5)) {
    console.log(
      `${property.address} | $${property.price} | ` +
      `${property.bedrooms} beds | ` +
      `Similarity: ${property.score.toFixed(4)}`
    );
  }
}

main()
  .then(() => {
    console.log("AI semantic search test completed.");
    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
