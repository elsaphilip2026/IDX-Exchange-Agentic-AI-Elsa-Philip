---
name: property-search
description: "Parse natural-language real estate property search requests into structured MLS search filters. Use when a user asks to find homes, condos, townhouses, land, or other properties using criteria such as city, price, bedrooms, bathrooms, square footage, pool, or view."
---

# Property Search

## Execution

1. Receive the user's natural-language property search request.
   - Example: "Find me a 3 bedroom house in Beverly Hills under $5m."
   - Done when the complete free-text query has been captured.

2. Parse the query using the property search parser in:
   `../../src/property-search-parser.ts`
   - Extract supported filters including city, minimum or maximum price, bedrooms, bathrooms, square footage, property type, pool, and view.
   - Done when the query has been converted into a structured filter object.

3. Map property types to MLS-compatible values.
   - house or single family -> `SingleFamilyResidence`
   - condo or condominium -> `Condominium`
   - townhouse or townhome -> `Townhouse`
   - land -> `UnimprovedLand`
   - Done when any recognized property type uses its MLS value.

4. Return the structured filter object for downstream MLS database search.
   - Do not invent filters that were not present in the user's request.
   - Done when the structured object contains only recognized search criteria.

## Verification

Validate parser behavior using:

`npx tsx tests/property-search-parser.test.ts`

The parser must successfully process at least 10 representative property-search queries before changes are considered complete.
