import { parsePropertySearch } from "./property-search-parser";
import { searchActiveListings } from "./listing-search";

async function testListingSearch() {
  try {
    const userQuery = "Find me a 3 bedroom house in Beverly Hills under $5m";

    console.log("User query:");
    console.log(userQuery);

    const filters = parsePropertySearch(userQuery);

    console.log("\nParsed filters:");
    console.log(filters);

    const listings = await searchActiveListings(filters);

    console.log(`\nFound ${listings.length} listings:`);
    console.log(listings);
  } catch (error) {
    console.error("Listing search failed:");
    console.error(error);
  }
}

testListingSearch();
