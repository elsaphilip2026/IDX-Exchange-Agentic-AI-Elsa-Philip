import {
  getSession,
  updateSession,
  clearSession,
} from "./session-memory";

const userId = "test-user";

console.log("1. New session:");
console.log(getSession(userId));

console.log("\n2. User says: Find homes in Irvine");
updateSession(userId, {
  city: "Irvine",
  conversationStep: 1,
});
console.log(getSession(userId));

console.log("\n3. User says: Under $1.2M");
updateSession(userId, {
  maxPrice: 1200000,
  conversationStep: 2,
});
console.log(getSession(userId));

console.log("\n4. User says: At least 3 bedrooms");
updateSession(userId, {
  bedrooms: 3,
  conversationStep: 3,
});
console.log(getSession(userId));

console.log("\n5. Clear session");
clearSession(userId);
console.log(getSession(userId));
