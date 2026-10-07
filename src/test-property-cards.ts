import { parsePropertySearch } from "./property-search-parser";
import { searchActiveListings } from "./listing-search";
import { formatListingCards } from "./property-formatter";

async function testPropertyCards() {
  try {
    const userQuery =
      "Find me a 3 bedroom house in Beverly Hills under $5m";

    console.log("User query:");
    console.log(userQuery);

    const filters = parsePropertySearch(userQuery);

    console.log("\nParsed filters:");
    console.log(filters);

    const listings = await searchActiveListings(filters, 1, 5);

    console.log("\nProperty Results:\n");
    console.log(formatListingCards(listings));
  } catch (error) {
    console.error("Property search failed:");
    console.error(error);
  }
}

testPropertyCards();
