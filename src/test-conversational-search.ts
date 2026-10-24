import {
  handleSearchMessage,
} from "./conversational-search";

const userId = "elsa-test";

console.log("\nMESSAGE 1: Find homes in Irvine");
console.log(
  handleSearchMessage(
    userId,
    "Find homes in Irvine"
  )
);

console.log("\nMESSAGE 2: Under $1.2M");
console.log(
  handleSearchMessage(
    userId,
    "Under $1.2M"
  )
);

console.log("\nMESSAGE 3: At least 3 bedrooms");
console.log(
  handleSearchMessage(
    userId,
    "At least 3 bedrooms"
  )
);

console.log("\nMESSAGE 4: With a pool");
console.log(
  handleSearchMessage(
    userId,
    "With a pool"
  )
);
