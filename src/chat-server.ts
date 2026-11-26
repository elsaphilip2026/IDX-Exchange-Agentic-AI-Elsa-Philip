import { adaptOrchestratorResponse } from "./orchestrator-response-adapter";
import { orchestrate } from "./orchestrator";
import { generateRagAnswer } from "./rag-answer-generator.js";
import { recommendSimilarListings } from "./recommendation-engine";
import { searchListingsOffline } from "./semantic-search-offline";
import { searchCachedListings } from "./cached-semantic-search";
import { detectMarketCity } from "./market-city-parser";
import express from "express";
import { realEstateGlossary } from "./real-estate-glossary";
import path from "path";
import { randomUUID } from "crypto";
import { searchFromConversation } from "./conversational-search";
import { clearSession, getSession } from "./session-memory";
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

app.post("/api/semantic-search", async (req, res) => {
  try {
    const city = String(req.body?.city || "").trim();
    const description = String(req.body?.description || "").trim();

    if (!city || !description) {
      return res.status(400).json({
        error: "Please provide both city and description.",
      });
    }

    const results = await searchListingsOffline(
      city,
      description,
      100
    );

    return res.json({
      route: "semantic-search-offline",
      method: "keyword-overlap",
      city,
      description,
      count: results.length,
      disclaimer:
        "Offline keyword matching only. These are not AI embedding similarity scores.",
      properties: results.map((property) => ({
        listingId: property.listingId,
        city: property.city,
        price: property.price,
        score: property.score,
        descriptionPreview:
          property.description?.slice(0, 150) ?? "",
      })),
    });
  } catch (error) {
    console.error("Offline search error:", error);

    return res.status(500).json({
      error: "Offline property search failed.",
    });
  }
});
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

// Week 9: Central multi-agent orchestration.
    const result = await orchestrate(message, sessionId);

    return res.json(
      adaptOrchestratorResponse(sessionId, result)
    );

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

app.listen(PORT, "127.0.0.1", () => {
  console.log("");
  console.log("IDX Exchange AI Web Chat");
  console.log(`Running at http://localhost:${PORT}`);
  console.log("");
});
