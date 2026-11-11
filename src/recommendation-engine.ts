import { readFile } from "node:fs/promises";
import { query } from "./mysql";
import {
  calculateRecommendationScore,
  type RecommendationProperty,
} from "./recommendation-scoring";
import { validateRecommendationPrice } from "./recommendation-comps";

interface CachedListing {
  L_ListingID: string;
  embedding: number[];
}

interface ActiveListing {
  L_ListingID: string;
  L_Address: string;
  L_City: string;
  L_SystemPrice: number;
  L_Keyword2: number;
  LM_Int2_3: number;
  L_Status: string;
}

export async function recommendSimilarListings(
  targetListingId: string,
  limit = 5
) {
  const file = await readFile(
    "data/irvine-embeddings.json",
    "utf8"
  );

  const cached: CachedListing[] = JSON.parse(file);

  const targetCache = cached.find(
    (listing) =>
      String(listing.L_ListingID) === String(targetListingId)
  );

  if (!targetCache) {
    throw new Error(
      "Selected listing is not in the Irvine embedding cache."
    );
  }

  const ids = [...new Set(
    cached.map((listing) => String(listing.L_ListingID))
  )];

  const placeholders = ids.map(() => "?").join(",");

  const active = await query<ActiveListing>(
    `SELECT
       L_ListingID, L_Address, L_City,
       L_SystemPrice, L_Keyword2, LM_Int2_3, L_Status
     FROM rets_property
     WHERE L_ListingID IN (${placeholders})
       AND L_Status = 'Active'`,
    ids
  );

  const activeById = new Map(
    active.map((listing) => [String(listing.L_ListingID), listing])
  );

  const target = activeById.get(String(targetListingId));

  if (!target) {
    throw new Error("Selected listing is not currently active.");
  }

  function toProperty(listing: ActiveListing): RecommendationProperty {
    return {
      listingId: String(listing.L_ListingID),
      price: Number(listing.L_SystemPrice),
      beds: Number(listing.L_Keyword2),
      city: listing.L_City,
      sqft: Number(listing.LM_Int2_3),
    };
  }

  const scored = cached
    .filter((listing) =>
      String(listing.L_ListingID) !== String(targetListingId)
    )
    .map((listing) => {
      const current = activeById.get(String(listing.L_ListingID));

      if (
        !current ||
        !Array.isArray(listing.embedding) ||
        listing.embedding.length !== targetCache.embedding.length
      ) {
        return null;
      }

      const score = calculateRecommendationScore(
        toProperty(target),
        toProperty(current),
        targetCache.embedding,
        listing.embedding
      );

      return {
        listingId: String(current.L_ListingID),
        address: current.L_Address,
        city: current.L_City,
        price: Number(current.L_SystemPrice),
        bedrooms: Number(current.L_Keyword2),
        sqft: Number(current.LM_Int2_3),
        score,
      };
    })
    .filter((listing): listing is NonNullable<typeof listing> =>
      listing !== null
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const recommendations = await Promise.all(
    scored.map(async (listing) => ({
      ...listing,
      comps: await validateRecommendationPrice(
        listing.city,
        listing.sqft,
        listing.price
      ),
    }))
  );

  return {
    targetListingId: String(targetListingId),
    candidatePool: active.length - 1,
    recommendations,
  };
}
