---
name: mls-property-search
description: "Search active MLS listings and sold comparable properties using structured real estate filters. Use after a natural-language property request has been parsed into filters such as city, price, bedrooms, bathrooms, square footage, property type, pool, or view."
---

# MLS Property Search

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

3. For active property searches, use:
   `../../src/listing-search.ts`

   Query the `rets_property` MLS table using parameterized SQL.

   - Apply only filters provided by the user.
   - Use pagination with LIMIT and OFFSET.
   - Do not construct SQL using untrusted user text directly.

4. For sold comparable property requests, use:
   `../../src/sold-comps.ts`

   Query the `california_sold` MLS table.

   - Filter by city.
   - Use the requested month range when provided.
   - Default to 12 months when no range is provided.

5. Format database results using:
   `../../src/property-formatter.ts`

   Return readable property cards instead of raw database rows.

6. Do not invent property information.

   Only return property information obtained from the MLS database.

## Active Listing Verification

Test the complete pipeline with:

`npx tsx src/test-property-cards.ts`

Expected workflow:

Natural-language query
→ structured filters
→ active MLS query
→ formatted property cards

## Sold Comps Verification

Test sold comparable properties with:

`npx tsx src/test-sold-comps.ts`

Expected workflow:

City and time range
→ california_sold query
→ sold property results
