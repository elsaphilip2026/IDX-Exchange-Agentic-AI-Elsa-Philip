import { test } from "node:test";
import assert from "node:assert/strict";
import { emailDraftAgent } from "../src/email-draft-agent";
import { updateSession, clearSession } from "../src/session-memory";

test("Generate email from previous property results", async () => {
  const userId = "email-test-user-1";

  clearSession(userId);

  updateSession(userId, {
    city: "Irvine",
    maxPrice: 1200000,
    bedrooms: 3,
    lastResults: [
      {
        L_ListingID: "1177293155",
        L_Address: "44 Fallbrook",
        L_City: "Irvine",
        price: 735000,
        beds: 3,
        baths: 2,
        sqft: 1084,
        DaysOnMarket: 61,
        CumulativeDaysOnMarket: 121,
        AssociationFee: 393,
        AssociationFeeFrequency: "Monthly",
        type: "Condominium",
      },
    ],
  });

  const result = await emailDraftAgent(
    "Draft an email summarizing these properties",
    userId
  );

  assert.equal(result.count, 1);
  assert.equal(result.subject, "Property Search Summary - Irvine");

  assert.ok(result.body.includes("44 Fallbrook"));
  assert.ok(result.body.includes("$735,000"));
  assert.ok(result.body.includes("$1,200,000"));
  assert.ok(result.body.includes("Days on Market: 61"));
  assert.ok(result.body.includes("$393 Monthly"));
  assert.ok(result.reply.includes("No email has been sent"));

  clearSession(userId);
});

test("Handle missing property search results", async () => {
  const userId = "email-test-user-2";

  clearSession(userId);

  const result = await emailDraftAgent(
    "Draft an email",
    userId
  );

  assert.equal(result.count, 0);
  assert.ok(result.reply.includes("Please search for properties first"));

  clearSession(userId);
});

test("Keep email drafts isolated between users", async () => {
  const userA = "email-test-user-A";
  const userB = "email-test-user-B";

  clearSession(userA);
  clearSession(userB);

  updateSession(userA, {
    city: "Irvine",
    lastResults: [
      {
        L_ListingID: "1234567890",
        L_Address: "Test Property",
        L_City: "Irvine",
        price: 500000,
        beds: 3,
        baths: 2,
        sqft: 1200,
      },
    ],
  });

  const resultA = await emailDraftAgent(
    "Draft an email",
    userA
  );

  const resultB = await emailDraftAgent(
    "Draft an email",
    userB
  );

  assert.equal(resultA.count, 1);
  assert.equal(resultB.count, 0);
  assert.ok(!resultB.reply.includes("Test Property"));

  clearSession(userA);
  clearSession(userB);
});
