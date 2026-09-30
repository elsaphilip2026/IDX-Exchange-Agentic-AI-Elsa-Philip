import { parsePropertySearch } from "../src/property-search-parser";

const testQueries = [
  "Find me a 3 bedroom house under $500,000",
  "Show me a 2 bed condo below 400k",
  "I want a 4 bedroom house under 1m",
  "Find a 3 bed townhouse over $300,000",
  "Show me a 2 bedroom apartment above 250k",
  "Find a 4 bed 3 bath house under $750,000",
  "Show me a 3 bedroom 2 bathroom condo below 600k",
  "I need a 5 bedroom house more than $500,000",
  "Find a 2 bed 1.5 bath apartment under 350k",
  "Show me a 4 bedroom 3 bathroom townhouse under 900k"
];

testQueries.forEach((query, index) => {
  console.log(`\nTest ${index + 1}: ${query}`);
  console.log(parsePropertySearch(query));
});
