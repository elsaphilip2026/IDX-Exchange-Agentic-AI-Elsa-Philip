# Week 6 — AI Semantic Property Search

## Objective

Implement AI-powered semantic property search for the IDX Exchange Assistant, enabling users to describe the type of home they want in natural language rather than relying exclusively on structured search filters.

## Implementation

The Week 6 implementation includes:

- Local AI text embeddings using Hugging Face Transformers.
- The `Xenova/all-MiniLM-L6-v2` embedding model.
- 384-dimensional vector representations of property descriptions.
- Cached embeddings for 100 Irvine property listings.
- Cosine similarity ranking between user queries and property descriptions.
- Price and bedroom filtering.
- Integration with the existing Express chatbot.
- Keyword-based fallback search for cities without a local embedding cache.
- Clear responses when no matching properties are found.

## Architecture

User Query
→ Express `/api/chat`
→ Descriptive Search Detection
→ City and Filter Extraction
→ Local Query Embedding
→ Cached Property Embeddings
→ Cosine Similarity Ranking
→ Price and Bedroom Filtering
→ Formatted Property Results

For cities without cached embeddings, the system uses an offline keyword-matching fallback.

## Key Files

- `src/local-embeddings.ts` — Local Hugging Face embedding generation.
- `src/build-embedding-cache.ts` — Generates property embedding cache.
- `src/cached-semantic-search.ts` — Cached semantic search and filtering.
- `src/vector-similarity.ts` — Cosine similarity calculations.
- `src/semantic-listing-search.ts` — MLS-backed listing retrieval.
- `src/semantic-search-offline.ts` — Keyword-based fallback.
- `src/listing-embeddings.ts` — Additional API-based embedding implementation.
- `src/chat-server.ts` — Chatbot integration and routing.
- `src/test-local-semantic-search.ts` — Local embedding tests.
- `src/test-semantic-search-offline.ts` — Offline search tests.

## AI Model

Model: `Xenova/all-MiniLM-L6-v2`

Framework: `@huggingface/transformers`

Embedding dimensions: 384

Execution: Local CPU inference

The model converts natural-language queries and property descriptions into numerical vectors. Cosine similarity is used to rank properties by semantic relevance.

The local embedding workflow does not require OpenAI API credits.

## Testing

### Test Query

"Find modern homes in Irvine under $1.2 million with at least 3 bedrooms."

### Results

The chatbot returned ranked property matches including:

| Property | Price | Bedrooms | Similarity |
|---|---:|---:|---:|
| 8 Deodar | $1,100,000 | 4 | 74% |
| 25 Delancy | $1,195,000 | 3 | 66% |
| 252 Harringay | $1,100,000 | 3 | 65% |
| 26 Helena 69 | $1,020,000 | 3 | 63% |
| 142 Hedge Bloom | $1,028,888 | 3 | 61% |

Similarity scores indicate relative semantic relevance within the tested search, not a calibrated probability of correctness.

### No-Results Test

Query:

"Find modern homes in Irvine under $100,000 with at least 5 bedrooms."

The chatbot correctly returned no matching properties rather than displaying unrelated listings.

### Validation

- Local semantic search test completed successfully.
- Offline fallback search test completed successfully.
- TypeScript validation passed.
- Browser-based chatbot search tested successfully.
- Existing structured property search was preserved.

## Limitations

- The local AI embedding cache currently contains 100 Irvine properties.
- Other cities use keyword-based matching rather than the same AI semantic ranking.
- Results depend on the descriptions available in MLS records.
- Similarity scores do not independently verify property features.
- The embedding model provides semantic retrieval, not full generative AI conversation.
- The embedding cache must be refreshed to reflect changes in MLS listings.

## Outcome

Successfully implemented and tested local AI semantic property search integrated with the IDX Exchange chatbot.

The system can rank property listings by natural-language descriptions while applying structured search filters, without requiring paid embedding API calls for the local workflow.

## Future Improvements

- Expand embedding coverage to additional cities.
- Automate embedding cache refreshes.
- Improve descriptive-query detection.
- Combine semantic ranking with stronger structured MLS filters.
- Add automated end-to-end regression tests.
- Explore persistent vector storage for larger listing collections.
