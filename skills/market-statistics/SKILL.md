---
name: market-statistics
description: "Analyze California housing markets using historical MLS sold data and active listing inventory. Use when users ask about median prices, average prices, price per square foot, days on market, negotiation leverage, market trends, or housing inventory in a California city."
---

# Market Statistics Agent

## Goal

Answer California real estate market questions using actual MLS database statistics.

Use:
- `../../src/market-statistics.ts`
- `../../src/listing-search.ts`
- `../../src/mysql.ts`

Historical sales source:
`california_sold.california_sold`

Active listing source:
`rets_property`

## Conversation Rules

1. A California city is required before running a market analysis.
2. If the city is missing, ask the user which city they want analyzed.
3. Preserve the city and reporting period during follow-up questions.
4. Do not assume missing market statistics.
5. Clearly distinguish historical sold data from current active listings.
6. Never invent market trends or property statistics.

## Core Market Metrics

For a requested city, retrieve:

- Number of homes sold
- Average closing price
- Median closing price
- Average price per square foot
- Average days on market
- List-to-close price ratio
- Monthly price trends

Use the corresponding functions in:
`../../src/market-statistics.ts`

## Inventory Comparison

Use `getInventoryComparison()` to retrieve:

- Active listing count
- Sold-home count
- Average monthly sales
- Months of inventory, when reliable

Active listings must use:
- Table: `rets_property`
- City field: `L_City`
- Status field: `L_Status`
- Active status: `Active`

Historical sold properties must use:
- Table: `california_sold.california_sold`
- City field: `City`
- Property type: `Residential`

Do not report months of inventory as reliable when the historical sales window is incomplete or stale.

## Historical Data Coverage

Use `getMarketDataCoverage()` to determine:

- Earliest available sale date
- Latest available sale date
- Total residential sales
- Available historical months
- Whether at least 12 months of history is available

Always disclose when requested historical periods exceed the available data.

Do not calculate year-over-year changes without sufficient historical records.

## Market Trend Analysis

Use the monthly trend function to retrieve:

- Monthly sales volume
- Average closing price
- Average price per square foot
- Average days on market
- Month-over-month average price change

Clearly identify the months included in the analysis.

Do not interpret changes in monthly average prices as guaranteed changes in individual property values.

## Response Format

Present market analysis using:

1. City and reporting period
2. Median and average sold prices
3. Average price per square foot
4. Average days on market
5. List-to-close ratio
6. Monthly price trend
7. Active inventory, when available
8. Historical data coverage and limitations

Use readable summaries and tables where appropriate.

## Data Integrity

- All market figures must come from MLS database queries.
- Use parameterized SQL.
- Do not invent missing values.
- Distinguish unavailable data from zero.
- Disclose incomplete or outdated records.
- Do not describe historical statistics as real-time market conditions.

## Verification

Run:

`npx tsx src/test-market-statistics.ts`

`npx tsx src/test-market-trends.ts`

`npx tsx src/test-market-coverage.ts`

`npx tsx src/test-inventory-comparison.ts`

`npx tsx src/test-data-coverage.ts`

Expected workflow:

User market question
→ City identification
→ Market statistics functions
→ Parameterized MySQL queries
→ Historical sales and active inventory
→ Data coverage validation
→ Data-backed market summary

## Market API Execution

For every user request involving housing market statistics:

1. Identify the California city.
2. Ask for the city if it is missing.
3. Identify the requested reporting period. Default to 12 months.
4. Execute the market API using the available command-execution tool.

API endpoint:

POST http://localhost:3000/api/market

Request format:

{
  "city": "Irvine",
  "months": 12
}

The API returns:

- summary
- monthly_trends
- data_coverage
- inventory
- data_limitations

Execution example:

curl -sS -X POST http://localhost:3000/api/market \
  -H "Content-Type: application/json" \
  -d '{"city":"Irvine","months":12}'

Response handling:

1. Read the returned JSON.
2. Use the actual returned values in the answer.
3. Format the results into a readable market report.
4. Explain monthly price movements.
5. Clearly disclose incomplete historical coverage.
6. Do not describe historical sales as real-time market conditions.
7. Do not invent missing statistics.

If the API request fails:
- Do not fabricate market statistics.
- Explain that market data is temporarily unavailable.
- Report the actual connection or API error when available.
