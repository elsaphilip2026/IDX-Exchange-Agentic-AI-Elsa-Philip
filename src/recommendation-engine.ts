import { readFile } from "node:fs/promises";
import { query } from "./mysql";
import { getLocalEmbedding } from "./local-embeddings";
import {
  buildListingText,
  type EmbeddingListing,
} from "./listing-embeddings";
import { searchActiveListings } from "./listing-search";
import type { PropertyFilters } from "./property-search-parser";
import {
  calculateRecommendationScore,
  type RecommendationProperty,
} from "./recommendation-scoring";
import { validateRecommendationPrice } from "./recommendation-comps";

interface CachedListing {
  L_ListingID: string;
  listingText: string;
  embedding: number[];
}

const runtimeCache = new Map<string, number[]>();

async function loadCachedEmbeddings() {
  try {
    const file = await readFile(
      "data/irvine-embeddings.json",
      "utf8"
    );

    const cached: CachedListing[] = JSON.parse(file);

    return new Map(
      cached.map(listing => [
        String(listing.L_ListingID),
        listing,
      ])
    );
  } catch {
    return new Map<string, CachedListing>();
  }
}

async function getPropertyEmbedding(
  listing: EmbeddingListing,
  cached: Map<string, CachedListing>
): Promise<number[]> {
  const text = buildListingText(listing);
  const id = String(listing.L_ListingID);
  const existing = cached.get(id);

  if (
    existing &&
    existing.listingText === text &&
    Array.isArray(existing.embedding) &&
    existing.embedding.length === 384 &&
    existing.embedding.every(Number.isFinite)
  ) {
    return existing.embedding;
  }

  const key = `${id}:${text}`;

  const runtimeEmbedding = runtimeCache.get(key);

  if (runtimeEmbedding) {
    return runtimeEmbedding;
  }

  const embedding = await getLocalEmbedding(text);

  if (runtimeCache.size >= 1000) {
    const oldest = runtimeCache.keys().next().value;
    if (oldest !== undefined) {
      runtimeCache.delete(oldest);
    }
  }

  runtimeCache.set(key, embedding);

  return embedding;
}

function toProperty(
  listing: EmbeddingListing
): RecommendationProperty {
  return {
    listingId: String(listing.L_ListingID),
    price: Number(listing.L_SystemPrice),
    beds: Number(listing.L_Keyword2),
    city: listing.L_City,
    sqft: Number(listing.LM_Int2_3),
  };
}

export async function recommendSimilarListings(
  targetListingId: string,
  limit = 5,
  preferences: PropertyFilters = {}
) {
  const targets = await query<EmbeddingListing>(
    `SELECT
       L_ListingID,
       L_Address,
       L_City,
       L_Type_,
       L_Keyword2,
       LM_Dec_3,
       LM_Int2_3,
       L_SystemPrice,
       L_Remarks
     FROM rets_property
     WHERE L_ListingID = ?
       AND L_Status = 'Active'
     LIMIT 1`,
    [targetListingId]
  );

  const target = targets[0];

  if (!target) {
    throw new Error(
      "Selected listing is not currently active."
    );
  }

  const filters: PropertyFilters = {
    ...preferences,
    city: preferences.city || target.L_City,
  };

  const rows = await searchActiveListings(
    filters,
    1,
    100,
    true
  );

  const candidates: EmbeddingListing[] = rows
    .filter(row =>
      String(row.L_ListingID) !== String(targetListingId)
    )
    .map(row => ({
      L_ListingID: String(row.L_ListingID),
      L_Address: row.L_Address,
      L_City: row.L_City,
      L_Type_: row.type,
      L_Keyword2: row.beds,
      LM_Dec_3: row.baths,
      LM_Int2_3: row.sqft,
      L_SystemPrice: row.price,
      L_Remarks: row.L_Remarks ?? null,
    }));

  if (candidates.length === 0) {
    return {
      targetListingId: String(targetListingId),
      candidatePool: 0,
      recommendations: [],
    };
  }

  const cached = await loadCachedEmbeddings();

  const targetEmbedding = await getPropertyEmbedding(
    target,
    cached
  );

  const scored = [];

  for (const candidate of candidates) {
    const embedding = await getPropertyEmbedding(
      candidate,
      cached
    );

    const score = calculateRecommendationScore(
      toProperty(target),
      toProperty(candidate),
      targetEmbedding,
      embedding
    );

    scored.push({
      listingId: String(candidate.L_ListingID),
      address: candidate.L_Address,
      city: candidate.L_City,
      price: Number(candidate.L_SystemPrice),
      bedrooms: Number(candidate.L_Keyword2),
      sqft: Number(candidate.LM_Int2_3),
      score,
    });
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      a.listingId.localeCompare(b.listingId)
  );

  const recommendations = await Promise.all(
    scored.slice(0, limit).map(async listing => ({
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
    candidatePool: candidates.length,
    recommendations,
  };
}
