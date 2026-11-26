import {
  classifyIntent,
  splitIntentClauses,
  type AgentIntent,
} from "./intent-classifier";

import { parsePropertySearch } from "./property-search-parser";

export interface AgentTask {
  agent: AgentIntent;
  query: string;
}

export function decomposeQuery(
  query: string,
  agents: AgentIntent[]
): AgentTask[] {

  // Single-intent requests do not require decomposition.
  if (agents.length === 1) {
    return [{ agent: agents[0], query }];
  }

  // Split instructions while preserving search filters.
  const clauses = splitIntentClauses(query);

  // Extract shared location from the property search clause.
  const searchClause = clauses.find(clause =>
    classifyIntent(clause).agents.includes("search")
  );

  const sharedCity = searchClause
    ? parsePropertySearch(searchClause).city
    : parsePropertySearch(query).city;

  return agents.map(agent => {

    const matchingClauses = clauses.filter(clause =>
      classifyIntent(clause).agents.includes(agent)
    );

    let agentQuery =
      matchingClauses.length > 0
        ? matchingClauses.join(" and ")
        : query;

    // Share the search location with the market agent
    // when the market instruction has no explicit location.
    if (
      agent === "market" &&
      sharedCity &&
      !/\b(?:in|for|of)\s+[A-Za-z]/i.test(agentQuery)
    ) {
      agentQuery =
        agentQuery.replace(/[.!?]+$/, "") +
        ` in ${sharedCity}`;
    }

    return {
      agent,
      query: agentQuery,
    };
  });
}
