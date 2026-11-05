
export function cosineSimilarity(
  vectorA: number[],
  vectorB: number[]
): number {
  if (
    vectorA.length === 0 ||
    vectorA.length !== vectorB.length
  ) {
    throw new Error("Vectors must have equal, nonzero dimensions.");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] ** 2;
    normB += vectorB[i] ** 2;
  }

  if (normA === 0 || normB === 0) {
    throw new Error("Cannot compare zero-length vectors.");
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface ListingVector {
  listingId: string;
  embedding: number[];
}

export function findSimilarListings(
  queryEmbedding: number[],
  listingEmbeddings: ListingVector[],
  topK = 5
): { listingId: string; score: number }[] {
  return listingEmbeddings
    .map((listing) => ({
      listingId: listing.listingId,
      score: cosineSimilarity(
        queryEmbedding,
        listing.embedding
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
