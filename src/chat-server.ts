import { detectMarketCity } from "./market-city-parser";
import express from "express";
import path from "path";
import { randomUUID } from "crypto";
import { searchFromConversation } from "./conversational-search";
import { clearSession } from "./session-memory";
import {
  getCityMarketSummary,
  getMonthlyPriceTrend,
  getMarketDataCoverage,
  getInventoryComparison,
} from "./market-statistics";
const app = express();
const PORT = 3000;

// Browser demo sessions. Each browser can maintain its own conversation.
const sessions = new Map<string, { lastSeen: number }>();
const SESSION_MAX_AGE = 2 * 60 * 60 * 1000;

app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    let sessionId = String(req.body?.sessionId || "").trim();

    if (!message) {
      return res.status(400).json({
        error: "Please enter a property search.",
      });
    }

    // Remove expired browser sessions.
    const now = Date.now();
    for (const [id, session] of sessions) {
      if (now - session.lastSeen > SESSION_MAX_AGE) {
        clearSession(id);
        sessions.delete(id);
      }
    }

    // Create a session for a new browser conversation.
    if (!sessionId || !sessions.has(sessionId)) {
      sessionId = randomUUID();
    }

    sessions.set(sessionId, { lastSeen: now });

    // Handle reset without searching the database.
    if (/\b(?:reset|start over|new search|clear)\b/i.test(message)) {
      clearSession(sessionId);
      return res.json({
        sessionId,
        reply: "I've cleared your search. Which city are you interested in?",
        filters: {},
        count: 0,
        needsCity: true,
      });
    }
    // Route market-statistics questions before property-search parsing.
const isMarketQuestion =
  /\b(market|median|average price|price per square foot|days on market|list.to.close|price trend|inventory|seller.s market|buyer.s market)\b/i.test(message);

if (isMarketQuestion) {
  const city = await detectMarketCity(message);

  if (!city) {
    return res.json({
      sessionId,
      reply: "Which California city would you like market statistics for?",
      route: "market-statistics",
    });
  }

  const [summary, trends, coverage, inventory] = await Promise.all([
    getCityMarketSummary(city, 12),
    getMonthlyPriceTrend(city, 12),
    getMarketDataCoverage(city),
    getInventoryComparison(city, 6),
  ]);

  if (!summary) {
    return res.json({
      sessionId,
      reply: `I couldn't find historical market data for ${city}.`,
      route: "market-statistics",
    });
  }

  const money = (value: number | string | null) =>
    value == null ? "Unavailable" :
    `$${Number(value).toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })}`;

  const reply = [
    `📊 ${city} Housing Market Report`,
    "",
    `🏡 Median sold price: ${money(summary.median_close_price)}`,
    `💰 Average sold price: ${money(summary.avg_close_price)}`,
    `📐 Average price/sqft: ${money(summary.avg_price_per_sqft)}`,
    `⏳ Average days on market: ${summary.avg_dom ?? "Unavailable"}`,
    `🤝 List-to-close ratio: ${summary.list_to_close_pct ?? "Unavailable"}%`,
    `📋 Active listings: ${inventory.active_listings}`,
    "",
    "📈 Monthly average sold prices:",
    ...trends.map((trend) =>
      `${trend.month}: ${money(trend.avg_price)} (${trend.sales} sales)`
    ),
    "",
    `📅 Available sales history: ${coverage.earliest_sale ?? "Unknown"} to ${coverage.latest_sale ?? "Unknown"}`,
    "",
    "⚠️ Data limitations:",
    "These figures reflect historical MLS sales, not necessarily today's market.",
    "The available history may not cover a full 12 months or contain complete monthly records.",
    "Monthly average prices can change because different types of homes sold.",
  ].join("\n");

  return res.json({
    sessionId,
    reply,
    route: "market-statistics",
  });
}
    // Parse and retain criteria through the Week 4 conversation logic.
    const { session, listings } = await searchFromConversation(
      sessionId,
      message
    );

    // A city is required before searching the MLS database.
    if (!session.city) {
      return res.json({
        sessionId,
        reply: "Which city are you looking in? I'll keep your other criteria.",
        filters: session,
        count: 0,
        needsCity: true,
      });
    }

    const properties = listings.map((listing) => ({
      address: listing.L_Address,
      city: listing.L_City,
      price: listing.price,
      bedrooms: listing.beds,
      bathrooms: listing.baths,
      sqft: listing.sqft,
      photoCount: listing.PhotoCount,
    }));

    const reply = properties.length
  ? [
      `I found ${properties.length} matching active properties.`,
      ...properties.map((property) =>
        [
          `🏠 ${property.address}, ${property.city}`,
          `$${Number(property.price).toLocaleString("en-US")}`,
          `${property.bedrooms} beds | ${property.bathrooms} baths | ${property.sqft} sqft`,
          `📸 Photos: ${property.photoCount ?? "Unavailable"}`,
        ].join("\n")
      ),
    ].join("\n\n")
  : session.page > 1
      ? "You've reached the end of the results. There are no more matching properties. Would you like to adjust your filters?"
      : "I couldn't find matching properties. Try adjusting your criteria.";

    return res.json({
      sessionId,
      reply,
      filters: session,
      count: properties.length,
      // properties, // Temporarily disabled to test WhatsApp duplication
    });
  } catch (error) {
    console.error("IDX Exchange AI error:", error);
    return res.status(500).json({
  error: "I couldn't complete the property search. Please try again.",
});
  }
});

app.post("/api/market", async (req, res) => {
  try {
    const city = String(req.body?.city || "").trim();
    const months = Number(req.body?.months ?? 12);

    if (!city) {
      return res.status(400).json({
        error: "Please provide a California city.",
      });
    }

    if (!Number.isInteger(months) || months < 1 || months > 60) {
      return res.status(400).json({
        error: "Months must be between 1 and 60.",
      });
    }

    const [
      summary,
      trends,
      coverage,
      inventory,
    ] = await Promise.all([
      getCityMarketSummary(city, months),
      getMonthlyPriceTrend(city, months),
      getMarketDataCoverage(city),
      getInventoryComparison(city, 6),
    ]);

    if (!summary) {
      return res.status(404).json({
        error: `No historical market data found for ${city}.`,
      });
    }

    return res.json({
      city,
      reporting_period_months: months,
      summary,
      monthly_trends: trends,
      data_coverage: coverage,
      inventory,
      data_limitations: [
        "Historical sales are not necessarily current market conditions.",
        "Available date coverage does not guarantee complete records for every month.",
        "Months of inventory is unavailable when sales history is incomplete or stale.",
        "Month-over-month average prices may be affected by changes in the properties sold."
      ],
    });
  } catch (error) {
    console.error("Market statistics error:", error);

    return res.status(500).json({
      error: "Unable to retrieve market statistics.",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("IDX Exchange AI Web Chat");
  console.log(`Running at http://localhost:${PORT}`);
  console.log("");
});
