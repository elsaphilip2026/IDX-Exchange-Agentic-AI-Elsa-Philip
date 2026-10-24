import express from "express";
import path from "path";

import { parsePropertySearch } from "./property-search-parser";
import { searchActiveListings } from "./listing-search";
import { formatListingCards } from "./property-formatter";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(express.static(path.join(process.cwd(), "public")));

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({
        error: "Please enter a property search."
      });
    }

    // Natural language -> structured MLS filters
    const filters = parsePropertySearch(message);

    if (Object.keys(filters).length === 0) {
      return res.json({
        reply:
          "I couldn't identify enough property-search information. Try something like: Find me a 3 bedroom house in Beverly Hills under $5m."
      });
    }

    // Structured filters -> real MLS database
    const listings = await searchActiveListings(filters, 1, 5);

    // MLS rows -> readable property cards
    const formattedResults = formatListingCards(listings);

    res.json({
      reply:
        listings.length > 0
          ? `I found ${listings.length} matching active properties.\n\n${formattedResults}`
          : formattedResults,
      filters,
      count: listings.length
    });

  } catch (error) {
    console.error("IDX Exchange AI error:", error);

    res.status(500).json({
      error: "I couldn't complete the property search."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("🏠 IDX Exchange AI Chat");
  console.log(`Running at http://localhost:${PORT}`);
  console.log("");
});

