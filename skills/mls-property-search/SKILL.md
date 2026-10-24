---
name: mls-property-search
description: "Search active MLS listings and sold comparable properties using structured real estate filters. Use after a natural-language property request has been parsed into filters such as city, price, bedrooms, bathrooms, square footage, property type, pool, or view."
---

# MLS Property Search

## Conversation Rules

1. Treat each new property search as a conversational search.

2. City is required before executing an MLS database search.

3. If the user provides property criteria but does not provide a city:
   - Do NOT search the MLS database yet.
   - Do NOT guess or assume a city.
   - Do NOT reuse a city from an unrelated or previous property search.
   - Ask the user a short follow-up question such as:
     "Sure — what city are you looking in?"

4. When the user provides the missing city, combine it with the criteria from
   the current property-search conversation and execute the search.

5. For follow-up refinements to the same search, preserve relevant criteria.

   Example:

   User: "Find me a 3 bedroom house under $5 million."
   Assistant: "Sure — what city are you looking in?"
   User: "Beverly Hills."
   Assistant: Search for 3-bedroom homes in Beverly Hills under $5 million.
   User: "Only show me ones with a pool."
   Assistant: Preserve Beverly Hills, 3 bedrooms, and $5 million maximum,
   then add the pool filter.

6. Never invent missing search criteria.

## Execution

1. Receive a property-search request.

2. Parse the natural-language request using:
   `../../src/property-search-parser.ts`

   Convert the request into structured filters such as:
   - city
   - minPrice
   - maxPrice
   - bedrooms
   - bathrooms
   - minSqft
   - propertyType
   - pool
   - hasView
   - maxHoa

3. Before querying the database, verify that `city` is available for the
   current property search.

   If city is missing, stop and ask the user for the city.

4. For active property searches, use:
   `../../src/listing-search.ts`

   Query the `rets_property` MLS table using parameterized SQL.

   - Apply only filters provided by the user.
   - Use pagination with LIMIT and OFFSET.
   - Do not construct SQL using untrusted user text directly.

5. For sold comparable property requests, use:
   `../../src/sold-comps.ts`

   Query the `california_sold` MLS table.

   - City is required.
   - Use the requested month range when provided.
   - Default to 12 months when no range is provided.

6. Format database results using:
   `../../src/property-formatter.ts`

   Return readable property cards instead of raw database rows.

7. Do not invent property information.

   Only return property information obtained from the MLS database.

## Active Listing Verification

Test the complete pipeline with:

`npx tsx src/test-property-cards.ts`

Expected workflow:

Natural-language query
→ structured filters
→ city verification
→ active MLS query
→ formatted property cards

## Sold Comps Verification

Test sold comparable properties with:

`npx tsx src/test-sold-comps.ts`

Expected workflow:

City and time range
→ california_sold query
→ sold property results
