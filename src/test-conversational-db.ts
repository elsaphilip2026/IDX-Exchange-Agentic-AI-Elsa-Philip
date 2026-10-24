import {
  searchFromConversation,
} from "./conversational-search";

function showFilters(session: any) {
  const filters: string[] = [];

  if (session.city) {
    filters.push(`City: ${session.city}`);
  }

  if (session.maxPrice) {
    filters.push(
      `Max price: $${session.maxPrice.toLocaleString()}`
    );
  }

  if (session.bedrooms) {
    filters.push(
      `Bedrooms: ${session.bedrooms}+`
    );
  }

  console.log("Remembered:", filters.join(" | "));
}

async function run() {
  const userId = "week4-test-user";

  console.log("\n--- MESSAGE 1 ---");
  console.log("User: Find homes in Irvine");

  let result = await searchFromConversation(
    userId,
    "Find homes in Irvine"
  );

  showFilters(result.session);

  console.log("\n--- MESSAGE 2 ---");
  console.log("User: Under $1.2M");

  result = await searchFromConversation(
    userId,
    "Under $1.2M"
  );

  showFilters(result.session);

  console.log("\n--- MESSAGE 3 ---");
  console.log("User: At least 3 bedrooms");

  result = await searchFromConversation(
    userId,
    "At least 3 bedrooms"
  );

  showFilters(result.session);

  console.log("\n--- MLS RESULTS ---");

  if (result.listings.length === 0) {
    console.log("No matching listings found.");
  } else {
    result.listings.forEach((listing, index) => {
      console.log(
        `${index + 1}. ${listing.L_Address}, ${listing.L_City}`
      );

      console.log(
        `   $${listing.price?.toLocaleString()} | ` +
        `${listing.beds} beds | ` +
        `${listing.baths} baths | ` +
        `${listing.sqft?.toLocaleString()} sqft`
      );
    });
  }

  process.exit(0);
}

run().catch((error) => {
  console.error("Week 4 test failed:");
  console.error(error);
  process.exit(1);
});
