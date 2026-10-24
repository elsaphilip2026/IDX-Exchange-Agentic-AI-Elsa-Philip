
import express from "express";
import path from "path";
import { randomUUID } from "crypto";
import { searchFromConversation } from "./conversational-search";
import { clearSession } from "./session-memory";

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
    }));

    const reply = properties.length
      ? `I found ${properties.length} matching active properties.`
      : "I couldn't find matching properties. Try adjusting your criteria.";

    return res.json({
      sessionId,
      reply,
      filters: session,
      count: properties.length,
      properties,
    });
  } catch (error) {
    console.error("IDX Exchange AI error:", error);
    return res.status(500).json({
      error: "I couldn't complete the property search. Please try again.",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("IDX Exchange AI Web Chat");
  console.log(`Running at http://localhost:${PORT}`);
  console.log("");
});
