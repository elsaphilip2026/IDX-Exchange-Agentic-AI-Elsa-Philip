# Week 7 — Hybrid Property Recommendation Engine

## Objective

Build a recommendation engine that identifies five similar active
real-estate listings using structured property attributes and
AI embedding similarity.

Validate recommended asking prices against historical sold-property
data from the california_sold database.

## Architecture

User selects a property listing ID
        |
        v
Chatbot recommendation handler
        |
        v
Load cached property embeddings
        |
        v
Verify active listings in MySQL
        |
        v
Calculate hybrid similarity scores
        |
        v
Rank and select top five properties
        |
        v
Validate prices against sold comparables
        |
        v
Return recommendations to chatbot

## Hybrid Scoring Model

Maximum score: 100 points.

### Structured similarity — 60 points

Price similarity:
- Difference below $50,000: 20 points
- Difference below $150,000: 12 points
- Difference below $300,000: 5 points

Bedroom similarity:
- Same bedroom count: 15 points

Location similarity:
- Same city: 15 points

Square footage similarity:
- Difference below 300 sqft: 10 points
- Difference below 700 sqft: 5 points

### AI semantic similarity — 40 points

Model: Xenova/all-MiniLM-L6-v2

Embedding dimensions: 384

Semantic score:
clamp(cosine_similarity, 0, 1) * 40

Final score:
structured_score + semantic_score

## Data Sources

Active listings:
- MySQL table: rets_property

Historical sold properties:
- MySQL table: california_sold.california_sold

Embedding cache:
- data/irvine-embeddings.json

The current cache contains 100 unique Irvine listings.

## Comparable Sales Validation

Comparable properties must:
- Be in the same city
- Have PropertyType = Residential
- Have living area within 20% of the recommended property
- Have sold within the last six months
- Have valid sale prices and living areas

Estimated comparable price:
average sold price per square foot * property square footage

Price difference:
(asking price - estimated comparable price)
 / estimated comparable price * 100

The assessment is preliminary and is not a formal appraisal.

## Implementation Files

- src/recommendation-scoring.ts
- src/recommendation-comps.ts
- src/recommendation-engine.ts
- src/test-recommendation-comps.ts
- src/chat-server.ts

## Testing

TypeScript compilation: Passed

Comparable-sales database test: Passed

Test property:
- City: Irvine
- Square footage: 1,800
- Asking price: $1,100,000
- Comparable-sales estimate: $1,401,160
- Comparable sales: 284
- Difference: -21.5%

Recommendation test:
- Target listing: 1136991548
- Active candidate pool: 99
- Recommendations returned: 5

Top recommendation:
- Address: 26 Morning Dove, Irvine
- Asking price: $1,860,000
- Hybrid score: 88/100
- Comparable-sales estimate: $1,725,431
- Price difference: +7.8%

Chatbot integration: Passed

Invalid listing ID handling: Passed

Week 5 market statistics regression test: Passed

Week 6 semantic search regression test: Passed

## Current Limitations

1. Recommendations are limited to properties included in the
   100-listing Irvine embedding cache.
2. The recommendation engine checks current active status and
   current listing attributes before ranking properties.
3. Comparable-sales estimates do not account for all differences
   in neighborhood, property condition, amenities, or lot size.
4. Historical sales coverage currently ends September 17, 2026.
5. Similarity scores are ranking measures, not probabilities.

## Future Improvements

- Expand embedding coverage to additional California cities.
- Generate embeddings for newly added active listings.
- Add more detailed comparable-sales matching.
- Support recommendations for listings outside the existing cache.
- Add automated recommendation-engine tests.
