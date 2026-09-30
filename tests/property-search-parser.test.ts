import { parsePropertySearch } from "../src/property-search-parser";

const testQueries = [
  "Find me a 3 bedroom house in Beverly Hills under $5m",
  "Show me a 2 bed condo in Los Angeles below 800k",
  "I want a 4 bedroom house in San Diego under 1m with a pool",
  "Find a 3 bed townhouse in Irvine over $700,000",
  "Show me a single family home in Sacramento with 3 bedrooms and 2 bathrooms",
  "Find a 4 bed 3 bath house under $750,000 with a view",
  "Show me a 3 bedroom 2 bathroom condo in San Jose below 900k",
  "I need a 5 bedroom house with at least 2500 sq ft",
  "Find a 2 bed 1.5 bath condo under 650k with a pool",
  "Show me a 4 bedroom 3 bathroom townhouse in Pasadena under 900k with 1800 sqft and a view"
];

testQueries.forEach((query, index) => {
  console.log(`\nTest ${index + 1}: ${query}`);
  console.log(parsePropertySearch(query));
});
