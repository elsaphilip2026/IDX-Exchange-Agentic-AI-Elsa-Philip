import type { ListingRow } from "./listing-search";
import { compareProperties } from "./property-comparison";
import { parsePropertyComparison } from "./property-comparison-parser";
import { recommendSimilarListings } from "./recommendation-engine";
import type { AgentIntent } from "./intent-classifier";
import { generateRagAnswer } from "./rag-answer-generator";
import { realEstateGlossary } from "./real-estate-glossary";
import { emailDraftAgent } from "./email-draft-agent";
import { detectMarketCity } from "./market-city-parser";
import { getSession } from "./session-memory";
import { searchFromConversation } from "./conversational-search";
import {
  getCityMarketSummary,
  getMonthlyPriceTrend,
  getMarketDataCoverage,
  getInventoryComparison,
} from "./market-statistics";
export interface AgentContext {
  query: string;
  userId: string;
  comparisonListings?: ListingRow[];
}

export interface AgentResult {
  agent: AgentIntent;
  route: string;
  reply: string;
  count?: number;
  data?: unknown;
}

export type AgentHandler = (
  context: AgentContext
) => Promise<AgentResult>;

// Knowledge Agent
export async function ragAgent(
  context: AgentContext
): Promise<AgentResult> {
  const { query } = context;

  const glossaryQuestion = query.match(
    /^\s*(?:what\s+(?:is|are|does)\s+|define\s+|explain\s+)(.+?)\s*\??\s*$/i
  );

  if (glossaryQuestion) {
    let term = glossaryQuestion[1]
      .replace(/\s+mean$/i, "")
      .replace(/\s+in real estate$/i, "")
      .replace(/\s+mean$/i, "")
      .replace(/^the\s+/i, "")
      .trim()
      .toUpperCase();

    // Normalize equivalent real estate terminology.
    if (term === "LIST-TO-CLOSE RATIO") {
      term = "SALE-TO-LIST RATIO";
    }

    const definition = realEstateGlossary[term];

    if (definition) {
      return {
        agent: "knowledge",
        route: "real-estate-glossary",
        reply: definition,
      };
    }
  }

  const reply = await generateRagAnswer(query);

  return {
    agent: "knowledge",
    route: "rag-documentation",
    reply,
  };
}

// Email Agent
export async function emailAgent(
  context: AgentContext
): Promise<AgentResult> {
  const result = await emailDraftAgent(
    context.query,
    context.userId,
    context.comparisonListings
  );

  return {
    agent: "email",
    route: "email-draft",
    reply: result.reply,
    count: result.count,
    data: {
      subject: result.subject,
      body: result.body,
    },
  };
}
// Market Statistics Agent
export async function marketStatsAgent(
  context: AgentContext
): Promise<AgentResult> {
  const { query, userId } = context;

  const city =
    (await detectMarketCity(query)) ||
    getSession(userId).city;

  if (!city) {
    return {
      agent: "market",
      route: "market-statistics",
      reply:
        "Which California city would you like market statistics for?",
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
      agent: "market",
      route: "market-statistics",
      reply:
        `I couldn't find historical market data for ${city}.`,
      count: 0,
    };
  }

  const money = (
    value: number | string | null
  ): string =>
    value == null
      ? "Unavailable"
      : "$" + Number(value).toLocaleString("en-US", {
          maximumFractionDigits: 0,
        });

  const validTrends = trends.filter(
    (trend) =>
      trend.avg_price != null &&
      Number(trend.avg_price) > 0
  );

  let trendAssessment =
    "Insufficient monthly data to assess price direction.";

  if (validTrends.length >= 2) {
    const first = validTrends[0];
    const last = validTrends[validTrends.length - 1];

    const change =
      ((Number(last.avg_price) -
        Number(first.avg_price)) /
        Number(first.avg_price)) * 100;

    const direction =
      change > 0
        ? "increased"
        : change < 0
          ? "decreased"
          : "remained unchanged";

    trendAssessment =
      `Average sold prices ${direction} by ` +
      `${Math.abs(change).toFixed(1)}% between ` +
      `${first.month} and ${last.month}.`;
  }

  const reply = [
    `📊 ${city} Housing Market Report`,
    "",
    `Residential sales: ${summary.sold_count}`,
    `Median sold price: ${money(summary.median_close_price)}`,
    `Average sold price: ${money(summary.avg_close_price)}`,
    `Average price/sqft: ${money(summary.avg_price_per_sqft)}`,
    `Average days on market: ${summary.avg_dom ?? "Unavailable"}`,
    `List-to-close ratio: ${
      summary.list_to_close_pct == null
        ? "Unavailable"
        : summary.list_to_close_pct + "%"
    }`,
    `Active listings: ${inventory.active_listings}`,
    `Months of inventory: ${inventory.months_of_inventory ?? "Unavailable"}`,
    "",
    "📈 MONTHLY PRICE TRENDS",
    "",
    ...trends.map(
      (trend) =>
        `${trend.month}: ${money(trend.avg_price)} (${trend.sales} sales)`
    ),
    "",
    "PRICE TREND ASSESSMENT",
    trendAssessment,
    "",
    "DATA COVERAGE",
    `Available sales history: ${coverage.earliest_sale ?? "Unknown"} to ${coverage.latest_sale ?? "Unknown"}`,
    "",
    "DATA LIMITATIONS",
    "Historical MLS records may not reflect current market conditions.",
    "The requested 12-month period may contain incomplete monthly records.",
    "Average prices can change because different types of properties sold.",
  ].join("\n");

  return {
    agent: "market",
    route: "market-statistics",
    reply,
    count: Number(summary.sold_count),
    data: {
      city,
      summary,
      trends,
      coverage,
      inventory,
      trendAssessment,
    },
  };
}// Property Search Agent
export async function propertySearchAgent(
  context: AgentContext
): Promise<AgentResult> {
  const { query, userId } = context;

  // Compare properties from the latest session results.
  const comparison = parsePropertyComparison(query);

  if (comparison) {
    const session = getSession(userId);
    const listings = session.lastResults ?? [];

    const { firstNumber, secondNumber } = comparison;

    const validSelection =
      Number.isSafeInteger(firstNumber) &&
      Number.isSafeInteger(secondNumber) &&
      firstNumber >= 1 &&
      secondNumber >= 1 &&
      firstNumber <= listings.length &&
      secondNumber <= listings.length &&
      firstNumber !== secondNumber;

    if (!validSelection) {
      return {
        agent: "search",
        route: "property-comparison",
        reply: listings.length === 0
          ? "Please search for properties before requesting a comparison."
          : `Please select two different property numbers between 1 and ${listings.length}.`,
        count: 0,
        data: {
          comparisonSucceeded: false,
        },
      };
    }

    return {
      agent: "search",
      route: "property-comparison",
      reply: compareProperties(
        listings,
        firstNumber,
        secondNumber
      ),
      count: 2,
      data: {
        comparisonSucceeded: true,
        firstNumber,
        secondNumber,
        properties: [
          listings[firstNumber - 1],
          listings[secondNumber - 1],
        ],
      },
    };
  }

  const {
    session,
    listings,
    needsCity,
    semanticSearch,
    candidatePool,
  } = await searchFromConversation(userId, query);

  if (needsCity) {
    return {
      agent: "search",
      route: "property-search",
      reply: "Which city would you like to search for properties in?",
      count: 0,
      data: {
        filters: session,
        needsCity: true,
        properties: [],
      },
    };
  }

  if (listings.length === 0) {
    return {
      agent: "search",
      route: "property-search",
      reply:
        session.page > 1
          ? "There are no more matching properties."
          : `No matching properties were found in ${session.city}. Try adjusting your search criteria.`,
      count: 0,
      data: {
        filters: session,
        properties: [],
      },
    };
  }

  const money = (
    value: number | null | undefined
  ): string =>
    value == null
      ? "Unavailable"
      : "$" + Number(value).toLocaleString("en-US", {
          maximumFractionDigits: 0,
        });

  const properties = listings.map((listing) => ({
    listingId: listing.L_ListingID,
    address: listing.L_Address,
    city: listing.L_City,
    price: listing.price,
    bedrooms: listing.beds,
    bathrooms: listing.baths,
    sqft: listing.sqft,
    daysOnMarket: listing.DaysOnMarket,
    cumulativeDaysOnMarket: listing.CumulativeDaysOnMarket,
    hoaFee: listing.AssociationFee,
    hoaFrequency: listing.AssociationFeeFrequency,
    photoCount: listing.PhotoCount,
    propertyType: listing.type,
    similarityScore:
      "score" in listing && typeof listing.score === "number"
        ? listing.score
        : undefined,
  }));

  const propertyDetails = properties.map(
    (property, index) =>
      [
        `${index + 1}. ${property.address}, ${property.city}`,
        `Listing ID: ${property.listingId}`,
        `💰 Price: ${money(property.price)}`,
        `🛏 Bedrooms: ${property.bedrooms ?? "Unavailable"}`,
        `🛁 Bathrooms: ${property.bathrooms ?? "Unavailable"}`,
        `📐 Living area: ${property.sqft ?? "Unavailable"} sqft`,
        `Days on market: ${property.daysOnMarket ?? "Unavailable"}`,
        `Cumulative DOM: ${property.cumulativeDaysOnMarket ?? "Unavailable"}`,
        `HOA: ${money(property.hoaFee)} ${property.hoaFrequency ?? ""}`,
        `Property type: ${property.propertyType ?? "Unavailable"}`,
        ...(property.similarityScore !== undefined
          ? [`Semantic similarity: ${property.similarityScore.toFixed(3)}`]
          : []),
      ].join("\n")
  );

  // Clarify affordability without assuming a maximum budget.
  const isAffordabilityRequest =
    /\b(?:affordable|budget[- ]friendly|inexpensive|low[- ]cost|cheap)\b/i.test(query);

  const affordabilityNotes: string[] = [];

  if (isAffordabilityRequest) {
    if (session.maxPrice == null) {
      affordabilityNotes.push(
        "Affordability note: You have not specified a maximum budget.",
        "These are lower-priced matching properties, not a personalized affordability assessment.",
        "What is your preferred maximum purchase price?",
        ""
      );
    } else {
      affordabilityNotes.push(
        `Budget: Showing matching properties within your maximum budget of ${money(session.maxPrice)}.`,
        ""
      );
    }
  }

  const reply = [
    semanticSearch
      ? `🏠 AI-Ranked Properties in ${session.city}`
      : `🏠 Matching Properties in ${session.city}`,
    "",
    `Page ${session.page} — ${listings.length} properties`,
    "",
    ...(semanticSearch
      ? [
          `Descriptive preferences: ${session.semanticDescription}`,
          `Candidate pool: ${candidatePool ?? 0} active properties`,
          "Ranked using local AI embeddings.",
          "Similarity scores indicate relevance, not confirmed property features.",
          "",
        ]
      : []),
    ...affordabilityNotes,
    ...propertyDetails.flatMap((property) => [
      property,
      "",
    ]),
    semanticSearch
      ? (session.page * 5 < (candidatePool ?? 0)
          ? 'Say "show more" to see additional ranked properties.'
          : "You have reached the end of the ranked candidate pool.")
      : 'Say "show more" to see additional properties.',
    "You can also refine your budget, bedrooms, or other preferences.",
  ].join("\n");

  return {
    agent: "search",
    route: "property-search",
    reply,
    count: listings.length,
    data: {
      filters: session,
      properties,
      semanticSearch: semanticSearch ?? false,
      candidatePool,
    },
  };
}

// Recommendation Agent
export async function recommendationAgent(
  context: AgentContext
): Promise<AgentResult> {
  const { query, userId } = context;
  const session = getSession(userId);

  const explicitId = query.match(
    /\b(?:listing\s*(?:id|#)?\s*|#)(\d{8,12})\b/i
  );

  const ordinalMatch = query.match(
    /\b(first|second|third|fourth|fifth)\b/i
  );

  const numberMatch = query.match(
    /\b(?:property|listing|option)\s*#?\s*([1-5])\b/i
  );

  const ordinals: Record<string, number> = {
    first: 0,
    second: 1,
    third: 2,
    fourth: 3,
    fifth: 4,
  };

  const index = ordinalMatch
    ? ordinals[ordinalMatch[1].toLowerCase()]
    : numberMatch
      ? Number(numberMatch[1]) - 1
      : 0;

  // A comparison contains two possible recommendation references.
  // Ask the user to choose rather than silently selecting one.
  if (
    context.comparisonListings?.length === 2 &&
    !explicitId &&
    !ordinalMatch &&
    !numberMatch
  ) {
    const choices = context.comparisonListings.map(
      (property) =>
        `- ${property.L_Address} (Listing ID: ${property.L_ListingID})`
    );

    return {
      agent: "recommend",
      route: "recommendation-engine",
      reply: [
        "Which of the two compared properties would you like me to use as the recommendation reference?",
        "",
        ...choices,
        "",
        "Please specify the listing ID or original property number.",
      ].join("\n"),
      count: 0,
      data: {
        needsReference: true,
        referenceOptions: context.comparisonListings.map(
          property => ({
            listingId: property.L_ListingID,
            address: property.L_Address,
          })
        ),
      },
    };
  }

  const selectedListing = session.lastResults?.[index];

  const listingId =
    explicitId?.[1] ||
    query.match(/#(\d{8,12})\b/)?.[1] ||
    selectedListing?.L_ListingID;

  if (!listingId) {
    return {
      agent: "recommend",
      route: "recommendation-engine",
      reply:
        "Please search for properties first or provide a valid listing ID so I can recommend similar homes.",
      count: 0,
    };
  }

  try {
    const result = await recommendSimilarListings(
      String(listingId),
      5,
      session
    );

    const money = (value: number | null | undefined) =>
      value == null
        ? "Unavailable"
        : "$" + Number(value).toLocaleString("en-US", {
            maximumFractionDigits: 0,
          });

    const details = result.recommendations.map(
      (property, index) =>
        [
          `${index + 1}. ${property.address}, ${property.city}`,
          `Listing ID: ${property.listingId}`,
          `Price: ${money(property.price)}`,
          `Bedrooms: ${property.bedrooms}`,
          `Living area: ${property.sqft} sqft`,
          `Similarity score: ${Number(property.score).toFixed(3)}`,
          `Estimated comparable price: ${money(property.comps.estimatedCompPrice)}`,
          `Price assessment: ${property.comps.assessment}`,
        ].join("\n")
    );

    const reply = [
      "SIMILAR PROPERTY RECOMMENDATIONS",
      "",
      `Reference listing ID: ${listingId}`,
      `Recommendations found: ${result.recommendations.length}`,
      "",
      ...(details.length
        ? details.flatMap((detail) => [detail, ""])
        : ["No similar active properties were found within your current search preferences."]),
      "",
      "Recommendations are based on property similarity and available comparable sales.",
      "Comparable price estimates are not professional appraisals.",
      "Recommendations are ranked from up to 100 active properties matching supported search filters.",
    ].join("\n");

    return {
      agent: "recommend",
      route: "recommendation-engine",
      reply,
      count: result.recommendations.length,
      data: result,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "";

    if (
      message === "Selected listing is not currently active."
    ) {
      return {
        agent: "recommend",
        route: "recommendation-engine",
        reply:
          message +
          " Please select another active MLS property or provide a valid listing ID.",
        count: 0,
      };
    }

    throw error;
  }
}

// Centralized registry
export const agentRegistry: Partial<
  Record<AgentIntent, AgentHandler>
> = {
  knowledge: ragAgent,
  email: emailAgent,
  market: marketStatsAgent,
  search: propertySearchAgent,
  recommend: recommendationAgent,
};

export async function executeAgent(
  intent: AgentIntent,
  context: AgentContext
): Promise<AgentResult> {
  const handler = agentRegistry[intent];

  if (!handler) {
    throw new Error(
      `Agent not registered: ${intent}`
    );
  }

  return handler(context);
}
