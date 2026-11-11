import { cosineSimilarity } from "./vector-similarity";

export interface RecommendationProperty {
  listingId: string;
  price: number;
  beds: number;
  city: string;
  sqft: number;
}

export function calculateRecommendationScore(
  target: RecommendationProperty,
  candidate: RecommendationProperty,
  targetEmbedding: number[],
  candidateEmbedding: number[]
): number {
  let score = 0;

  // Structured similarity: maximum 60 points

  const priceDiff = Math.abs(target.price - candidate.price);

  if (priceDiff < 50000) {
    score += 20;
  } else if (priceDiff < 150000) {
    score += 12;
  } else if (priceDiff < 300000) {
    score += 5;
  }

  if (target.beds === candidate.beds) {
    score += 15;
  }

  if (
    target.city.trim().toLowerCase() ===
    candidate.city.trim().toLowerCase()
  ) {
    score += 15;
  }

  const sqftDiff = Math.abs(target.sqft - candidate.sqft);

  if (sqftDiff < 300) {
    score += 10;
  } else if (sqftDiff < 700) {
    score += 5;
  }

  // Semantic similarity: maximum 40 points

  const semanticSimilarity = cosineSimilarity(
    targetEmbedding,
    candidateEmbedding
  );

  // Keep the semantic contribution within 0–40 points.
  score += Math.max(0, Math.min(1, semanticSimilarity)) * 40;

  return Math.round(score * 100) / 100;
}
