import {
  getCityMarketSummary,
  getMonthlyPriceTrend,
  getMarketDataCoverage,
  getInventoryComparison,
} from "./market-statistics";

import { detectMarketCity } from "./market-city-parser";
import { getSession } from "./session-memory";
import type { EmailDraftResult } from "./email-draft-agent";

function money(value: number | null): string {
  if (value == null || !Number.isFinite(Number(value))) {
    return "Unavailable";
  }

  return "$" + Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}

export async function marketEmailDraft(
  query: string,
  userId: string
): Promise<EmailDraftResult> {
  const session = getSession(userId);

  const city =
    (await detectMarketCity(query)) || session.city;

  if (!city) {
    return {
      subject: "",
      body: "",
      reply:
        "Which California city would you like me to prepare a market summary email for?",
      count: 0,
    };
  }

  const [summary, trends, coverage, inventory] =
    await Promise.all([
      getCityMarketSummary(city, 12),
      getMonthlyPriceTrend(city, 12),
      getMarketDataCoverage(city),
      getInventoryComparison(city, 6),
    ]);

  if (!summary) {
    return {
      subject: "",
      body: "",
      reply:
        `I couldn't find historical market data for ${city} within the requested reporting period.`,
      count: 0,
    };
  }

  const subject = `Housing Market Summary - ${city}`;

  const trendDetails = trends.map((trend) =>
    `- ${trend.month}: ${money(trend.avg_price)} (${trend.sales} sales)`
  );

  const body = [
    "Hi,",
    "",
    `I wanted to share a housing market overview for ${city}, based on the available residential MLS sales data.`,
    "",
    "MARKET OVERVIEW",
    "",
    "Requested reporting period: Last 12 months",
    `Residential properties sold: ${summary.sold_count}`,
    `Median sold price: ${money(summary.median_close_price)}`,
    `Average sold price: ${money(summary.avg_close_price)}`,
    `Average price per square foot: ${money(summary.avg_price_per_sqft)}`,
    `Average days on market: ${summary.avg_dom ?? "Unavailable"}`,
    `List-to-close ratio: ${
      summary.list_to_close_pct == null
        ? "Unavailable"
        : summary.list_to_close_pct + "%"
    }`,
    `Active listings in MLS database: ${inventory.active_listings}`,
    `Months of inventory: ${inventory.months_of_inventory ?? "Unavailable"}`,
    "",
    "MONTHLY PRICE TRENDS",
    "",
    ...(trendDetails.length
      ? trendDetails
      : ["Monthly price trends are unavailable."]),
    "",
    "DATA COVERAGE AND LIMITATIONS",
    "",
    `Available sales history: ${coverage.earliest_sale ?? "Unknown"} to ${coverage.latest_sale ?? "Unknown"}`,
    "",
    "These statistics reflect available historical MLS records and may not represent current market conditions.",
    "The dataset may not contain complete records for every month.",
    "Changes in average sold prices may reflect differences in the types of properties sold.",
    "",
    "Please let me know if you would like a more detailed analysis or assistance identifying suitable properties in this area.",
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
    count: Number(summary.sold_count),
  };
}
