import { getSession } from "./session-memory";
import type { ListingRow } from "./listing-search";

export interface EmailDraftResult {
  subject: string;
  body: string;
  reply: string;
  count: number;
}

function formatMoney(
  value: number | string | null | undefined
): string {
  if (value == null || !Number.isFinite(Number(value))) {
    return "Unavailable";
  }

  return "$" + Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}
export async function emailDraftAgent(
  query: string,
  userId: string,
  comparisonListings?: ListingRow[]
): Promise<EmailDraftResult> {

  // Week 9: Route market-summary email requests.
  const isMarketEmail =
    /\b(market|market trends?|market statistics|median|average sold price|inventory|price trends?)\b/i.test(query);

  if (isMarketEmail) {
    const { marketEmailDraft } =
      await import("./market-email-draft");

    return marketEmailDraft(query, userId);
  }

  const session = getSession(userId);
  const listings: ListingRow[] =
    comparisonListings ?? session.lastResults ?? [];

  const isComparisonEmail =
    comparisonListings !== undefined;

  if (listings.length === 0) {
    return {
      subject: "",
      body: "",
      reply:
        "I don't have any property search results to summarize yet. " +
        "Please search for properties first, and then ask me to draft an email.",
      count: 0,
    };
  }

  const city =
    session.city || listings[0].L_City || "Selected Area";

  const subject = isComparisonEmail
    ? `Property Comparison Summary - ${city}`
    : `Property Search Summary - ${city}`;

  const propertyDetails = listings.map((property, index) => {
    return [
      `${index + 1}. ${property.L_Address}, ${property.L_City}`,
      `   Listing ID: ${property.L_ListingID}`,
      `   Asking Price: ${formatMoney(property.price)}`,
      `   Bedrooms: ${property.beds ?? "Unavailable"}`,
      `   Bathrooms: ${property.baths ?? "Unavailable"}`,
      `   Living Area: ${property.sqft ?? "Unavailable"} sqft`,
      `   Days on Market: ${property.DaysOnMarket ?? "Unavailable"}`,
      `   Cumulative Days on Market: ${property.CumulativeDaysOnMarket ?? "Unavailable"}`,
      `   HOA Fee: ${formatMoney(property.AssociationFee)} ${property.AssociationFeeFrequency ?? ""}`,
      `   Property Type: ${property.type ?? "Unavailable"}`,
    ].join("\n");
  });

  const body = [
    "Hi,",
    "",
    isComparisonEmail
      ? `I wanted to share a comparison summary of the ${listings.length} selected properties in ${city}.`
      : `I wanted to share a summary of ${listings.length} properties in ${city} that match the recent search criteria.`,
    "",
    "PROPERTY SEARCH CRITERIA",
    `Location: ${city}`,
    `Maximum Budget: ${session.maxPrice == null ? "Not specified" : formatMoney(session.maxPrice)}`,
    `Minimum Bedrooms: ${session.bedrooms ?? "Not specified"}`,
    "",
    isComparisonEmail
      ? "SELECTED PROPERTIES FOR COMPARISON"
      : "MATCHING PROPERTIES",
    "",
    ...propertyDetails.flatMap((property) => [property, ""]),
    "Please let me know if you would like additional information about any of these properties or would like to refine the search.",
    "",
    "Please note that listing prices and availability are subject to change.",
    "",
    "Best regards,",
    "[Your Name]",
  ].join("\n");

  return {
    subject,
    body,
    reply: [
      "EMAIL DRAFT",
      "",
      `Subject: ${subject}`,
      "",
      body,
      "",
      "This is a draft only. No email has been sent.",
    ].join("\n"),
    count: listings.length,
  };
}
