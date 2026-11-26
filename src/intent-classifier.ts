import {
  extractSemanticDescription,
  shouldClearSemanticDescription,
} from "./semantic-preference-parser";

import {
  parsePropertyComparison,
} from "./property-comparison-parser";

export type AgentIntent =
  | "search"
  | "market"
  | "recommend"
  | "knowledge"
  | "email";

export interface IntentClassification {
  intent: AgentIntent | "mixed" | "unknown";
  agents: AgentIntent[];
}

function classifySingleIntent(
  query: string
): IntentClassification {
  const text = query.trim().toLowerCase();

  const agents: AgentIntent[] = [];

  // Email drafting
  const isEmail =
    /\b(email|e-mail)\b/.test(text) &&
    /\b(draft|write|compose|prepare|create)\b/.test(text);

  if (isEmail) {
    return {
      intent: "email",
      agents: ["email"],
    };
  }

  // Property recommendations
  const isRecommendation =
    /\b(similar|recommend|recommendations|like this|comparable properties)\b/.test(text);

  // Explicit property search
  const isExplicitSearch =
    /\b(find|show|search|list|looking for)\b/.test(text) &&
    /\b(home|homes|house|houses|property|properties|listing|listings|condo|condos|townhouse|townhouses)\b/.test(text);

  // Pagination
  const isPagination =
    /^(?:show(?: me)? more|more results|next page|more properties)[.!?]*$/.test(text);

  // Conversational search filters
  const isFilterFollowUp =
    /^(?:under|below|over|above|between|at least|at most|less than|more than|up to|with|without|maximum|minimum|budget)\b/.test(text) ||
    /^\d+\s*(?:bedrooms?|beds?|bathrooms?|baths?)\b/.test(text);

  // Descriptive property searches and preference removal.
  const isDescriptiveSearch =
    Boolean(extractSemanticDescription(text)) &&
    (
      /\b(home|homes|house|houses|property|properties|listing|listings|condo|condos|townhouse|townhouses)\b/.test(text) ||
      /^(?:mountain views?|ocean views?|backyards?|gardens?|modern|charming|spacious|renovated|luxury)[.!?]*$/.test(text)
    ) &&
    !/^(?:what|why|how|define|explain)\b/.test(text);

  const isSemanticPreferenceRemoval =
    shouldClearSemanticDescription(text);

  // Numbered property comparison requests.
  const isPropertyComparison =
    parsePropertyComparison(query) !== null;

  const isSearch =
    isPropertyComparison ||
    isExplicitSearch ||
    isPagination ||
    isFilterFollowUp ||
    isDescriptiveSearch ||
    isSemanticPreferenceRemoval;

  // Database documentation
  const isDocumentation =
    /\b(california_sold|rets_property|trestle|metadata|schema|documentation|primer)\b/.test(text);

  // Mortgage knowledge
  const isMortgageQuestion =
    /\b(mortgage|home loan)\b/.test(text) &&
    /\b(interest|rates?|apr)\b/.test(text);

  // Definition requests
  const isDefinition =
    /\b(what (?:is|are|does)|define|explain|meaning of)\b[^.!?]*\b(dom|cdom|hoa|days on market|list.to.close ratio|sale.to.list ratio|mls|comps|mortgage|appraisal|inventory|price per square foot|list price|sold price)\b/.test(text);

  // Statistical requests
  const isStatisticalQuestion =
    /\b(?:average|median|typical)\s+(?:sold price|home price|price|days on market|dom|cdom|list.to.close ratio)\b/.test(text) ||
    /\b(?:dom|days on market|inventory|list.to.close ratio|price per square foot)\s+(?:in|for)\b/.test(text);

  // Knowledge intent
  const isKnowledge =
    isDocumentation ||
    isMortgageQuestion ||
    (isDefinition && !isStatisticalQuestion);

  // Explicit market analysis
  const isMarketTrend =
    /\b(market trends?|housing market|market statistics|market report|price trends?|prices? (?:are |is )?(?:rising|falling|increasing|decreasing)|seller.s market|buyer.s market)\b/.test(text);

  const isMarketMetric =
    /\b(median|average (?:sold |home )?price|price per square foot|inventory|days on market|list.to.close ratio)\b/.test(text);

  const isMarket =
    !isDocumentation &&
    (
      isMarketTrend ||
      isStatisticalQuestion ||
      (!isKnowledge && !isSearch && isMarketMetric)
    );

  // Register detected intents
  if (
    isSearch &&
    !isRecommendation &&
    !isDocumentation
  ) {
    agents.push("search");
  }

  if (isMarket) {
    agents.push("market");
  }

  if (isRecommendation) {
    agents.push("recommend");
  }

  if (isKnowledge) {
    agents.push("knowledge");
  }

  if (agents.length > 1) {
    return {
      intent: "mixed",
      agents,
    };
  }

  if (agents.length === 1) {
    return {
      intent: agents[0],
      agents,
    };
  }

  return {
    intent: "unknown",
    agents: [],
  };
}


// Split independent instructions while preserving property filters.
export function splitIntentClauses(query: string): string[] {
  return query
    .split(
      /\s+and\s+(?:then\s+)?(?=(?:tell|show|explain|give|analyze|compare|find|search|recommend|what|whether|are|is|draft|write|compose|prepare|create)\b)/i
    )
    .map(clause => clause.trim())
    .filter(Boolean);
}

// Classify independent instructions and combine their intents.
export function classifyIntent(
  query: string
): IntentClassification {

  const clauses = splitIntentClauses(query);

  if (clauses.length <= 1) {
    return classifySingleIntent(query);
  }

  const agents = [
    ...new Set(
      clauses.flatMap(
        clause => classifySingleIntent(clause).agents
      )
    ),
  ];

  if (agents.length === 0) {
    return classifySingleIntent(query);
  }

  return {
    intent: agents.length > 1 ? "mixed" : agents[0],
    agents,
  };
}
