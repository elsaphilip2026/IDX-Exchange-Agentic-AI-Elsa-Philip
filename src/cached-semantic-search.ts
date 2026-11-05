
import { readFile } from "node:fs/promises";
import { getLocalEmbedding } from "./local-embeddings";
import { cosineSimilarity } from "./vector-similarity";
import { parsePropertySearch } from "./property-search-parser";
export async function searchCachedListings(
  description: string,
  limit = 5
) {
  const file = await readFile(
    "data/irvine-embeddings.json",
    "utf8"
  );

  const listings = JSON.parse(file);

  const filters = parsePropertySearch(description);

  const filteredListings = listings.filter((listing: any) => {
   const price = Number(listing.L_SystemPrice);
   const bedrooms = Number(listing.L_Keyword2);

   if (filters.maxPrice !== undefined &&
      (!Number.isFinite(price) || price > filters.maxPrice)) {
    return false;
   }

   if (filters.minPrice !== undefined &&
      (!Number.isFinite(price) || price < filters.minPrice)) {
    return false;
   }

   if (filters.bedrooms !== undefined &&
      (!Number.isFinite(bedrooms) || bedrooms < filters.bedrooms)) {
    return false;
   }

  return true;
});

  // Generate an embedding only for the user's question.
  const queryEmbedding = await getLocalEmbedding(description);

  // Compare the question with saved property embeddings.
  const results = filteredListings.map((listing: any) => ({
    listingId: listing.L_ListingID,
    address: listing.L_Address,
    city: listing.L_City,
    price: listing.L_SystemPrice,
    bedrooms: listing.L_Keyword2,
    bathrooms: listing.LM_Dec_3,
    sqft: listing.LM_Int2_3,
    score: cosineSimilarity(
      queryEmbedding,
      listing.embedding
    ),
  }));

  // Highest similarity first.
  results.sort((a: any, b: any) => b.score - a.score);

  return results.slice(0, limit);
}
