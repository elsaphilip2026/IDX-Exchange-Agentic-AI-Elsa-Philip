# Week 2 – Natural-Language Property Search

## Objective

Build an OpenClaw skill that accepts a free-text real estate search request and converts it into a structured filter object for downstream MLS property search.

## MLS Field Mapping

The parser was designed around the available `rets_property` MLS dataset.

| Search Filter | MLS Field |
|---|---|
| City | `L_City` |
| Property Type | `L_Type_` |
| Price | `L_SystemPrice` |
| Bedrooms | `L_Keyword2` |
| Bathrooms | `LM_Dec_3` |
| Living Area / Sq Ft | `LM_Int2_3` |
| Pool | `PoolPrivateYN` |
| View | `ViewYN` |
| HOA Fee | `AssociationFee` |

## Parser Implementation

The TypeScript parser is located at:

`src/property-search-parser.ts`

It extracts supported criteria including:

- City
- Minimum price
- Maximum price
- Bedrooms
- Bathrooms
- Minimum square footage
- Property type
- Pool
- View

Property types are converted to MLS-compatible values:

- House / Single Family → `SingleFamilyResidence`
- Condo / Condominium → `Condominium`
- Townhouse / Townhome → `Townhouse`
- Land → `UnimprovedLand`

## Validation

The parser was validated using 10 representative natural-language property search queries.

### Test Queries

1. Find me a 3 bedroom house in Beverly Hills under $5m
2. Show me a 2 bed condo in Los Angeles below 800k
3. I want a 4 bedroom house in San Diego under 1m with a pool
4. Find a 3 bed townhouse in Irvine over $700,000
5. Show me a single family home in Sacramento with 3 bedrooms and 2 bathrooms
6. Find a 4 bed 3 bath house under $750,000 with a view
7. Show me a 3 bedroom 2 bathroom condo in San Jose below 900k
8. I need a 5 bedroom house with at least 2500 sq ft
9. Find a 2 bed 1.5 bath condo under 650k with a pool
10. Show me a 4 bedroom 3 bathroom townhouse in Pasadena under 900k with 1800 sqft and a view

The tests are located at:

`tests/property-search-parser.test.ts`

Run the tests with:

`npx tsx tests/property-search-parser.test.ts`

All 10 test queries were successfully parsed into structured filter objects.

## OpenClaw Skill

A model-discoverable OpenClaw skill was created at:

`skills/property-search/SKILL.md`

The skill was validated successfully:

`Skill is valid!`

After installation, OpenClaw reported:

`property-search ✓ Ready`

The skill is visible to the model and available as a command.

## End-to-End OpenClaw Test

Test request:

`Find me a 3 bedroom house in Beverly Hills under $5m with a pool.`

OpenClaw returned:

```json
{
  "city": "Beverly Hills",
  "bedrooms": 3,
  "maxPrice": 5000000,
  "propertyType": "SingleFamilyResidence",
  "pool": "True"
}
```

## Week 2 Outcome

Week 2 produced a working natural-language property search parser and an OpenClaw property-search skill.

The solution was validated against 10 property-search queries and successfully tested through the OpenClaw agent.

The structured filters are ready for the MLS database query layer in the next phase.
