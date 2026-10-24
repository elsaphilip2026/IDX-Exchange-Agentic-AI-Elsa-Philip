import * as readline from "readline";
import { searchFromConversation } from "./conversational-search";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const userId = "terminal-user";

console.log("\n🏠 IDX Exchange Property Assistant");
console.log("Type your property search one message at a time.");
console.log('Type "exit" to quit.\n');

function askUser() {
  rl.question("You: ", async (message) => {
    if (message.toLowerCase() === "exit") {
      console.log("\nGoodbye!");
      rl.close();
      return;
    }

    try {
      const result = await searchFromConversation(
        userId,
        message
      );

      const session = result.session;

      console.log("\nAssistant remembers:");

      if (session.city)
        console.log(`  City: ${session.city}`);

      if (session.maxPrice)
        console.log(
          `  Max price: $${session.maxPrice.toLocaleString()}`
        );

      if (session.minPrice)
        console.log(
          `  Min price: $${session.minPrice.toLocaleString()}`
        );

      if (session.bedrooms)
        console.log(
          `  Bedrooms: ${session.bedrooms}+`
        );

      if (session.bathrooms)
        console.log(
          `  Bathrooms: ${session.bathrooms}+`
        );

      console.log("\nMatching properties:");

      if (result.listings.length === 0) {
        console.log("  No matching properties found.");
      } else {
        result.listings.forEach((listing, index) => {
          console.log(
            `  ${index + 1}. ${listing.L_Address}, ${listing.L_City}`
          );

          console.log(
            `     $${listing.price?.toLocaleString()} | ` +
            `${listing.beds} beds | ` +
            `${listing.baths} baths | ` +
            `${listing.sqft?.toLocaleString()} sqft`
          );
        });
      }

      console.log();
      askUser();
    } catch (error) {
      console.error("\nSearch failed:", error);
      askUser();
    }
  });
}

askUser();
