import { searchActiveListings } from "./listing-search";
import { getLocalEmbedding } from "./local-embeddings";
import { buildListingText } from "./listing-embeddings";
import { cosineSimilarity } from "./vector-similarity";
import type { PropertyFilters } from "./property-search-parser";

export async function searchDynamicSemanticListings(
  description: string,
  filters: PropertyFilters,
  page = 1,
  limit = 5
) {
  const candidates = await searchActiveListings(
    filters,
    1,
    100,
    true
  );

  if (candidates.length === 0) {
    return {
      candidatePool: 0,
      results: [],
    };
  }

  const queryEmbedding = await getLocalEmbedding(
    description
  );

  const scored = [];

  for (const listing of candidates) {
    const listingText = buildListingText({
      L_ListingID: String(listing.L_ListingID),
      L_Address: listing.L_Address,
      L_City: listing.L_City,
      L_Type_: listing.type,
      L_Keyword2: listing.beds,
      LM_Dec_3: listing.baths,
      LM_Int2_3: listing.sqft,
      L_SystemPrice: listing.price,
      L_Remarks: listing.L_Remarks ?? null,
    });

    const embedding = await getLocalEmbedding(
      listingText
    );

    const score = cosineSimilarity(
      queryEmbedding,
      embedding
    );

    if (Number.isFinite(score)) {
      const { L_Remarks, ...property } = listing;

      scored.push({
        ...property,
        score,
      });
    }
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      String(a.L_ListingID).localeCompare(
        String(b.L_ListingID)
      )
  );

  const offset = (page - 1) * limit;

  return {
    candidatePool: candidates.length,
    results: scored.slice(offset, offset + limit),
  };
}
