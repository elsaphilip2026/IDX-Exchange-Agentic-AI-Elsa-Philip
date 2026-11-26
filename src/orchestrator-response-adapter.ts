import type { OrchestratorResult } from "./orchestrator";
import { getSession } from "./session-memory";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? value as Record<string, unknown>
    : {};
}

export function adaptOrchestratorResponse(
  sessionId: string,
  result: OrchestratorResult
): Record<string, unknown> {

  const response: Record<string, unknown> = {
    sessionId,
    reply: result.reply,
    route: result.route,
    intent: result.intent,
    agents: result.agents,
    executionTimeMs: result.executionTimeMs,
  };

  // Preserve the existing reset response contract.
  if (result.route === "session-reset") {
    return {
      ...response,
      filters: {},
      count: 0,
      needsCity: true,
    };
  }

  const search = result.results.find(
    item => item.agent === "search"
  );

  const recommendation = result.results.find(
    item => item.agent === "recommend"
  );

  const email = result.results.find(
    item => item.agent === "email"
  );

  const market = result.results.find(
    item => item.agent === "market"
  );

  // Preserve conversational search fields.
  if (search) {
    const data = asRecord(search.data);

    response.filters = getSession(sessionId);
    response.count = search.count ?? 0;
    response.needsCity = data.needsCity === true;

    // Expose structured comparison information.
    if (search.route === "property-comparison") {
      response.comparison = {
        succeeded: data.comparisonSucceeded === true,
        firstNumber: data.firstNumber ?? null,
        secondNumber: data.secondNumber ?? null,
        properties: data.properties ?? [],
      };
    }

    // Expose semantic search metadata.
    if (data.semanticSearch === true) {
      response.semanticSearch = true;
      response.candidatePool = data.candidatePool ?? 0;
    }

    // Do not expose top-level properties because
    // the existing reply already contains listing details.
  }

  // Preserve recommendation response fields.
  if (recommendation) {
    const data = asRecord(recommendation.data);

    response.recommendations =
      data.recommendations ?? [];

    // Expose reference clarification when needed.
    if (data.needsReference === true) {
      response.needsReference = true;
      response.referenceOptions =
        data.referenceOptions ?? [];
    }

    if (!search) {
      response.count = recommendation.count ?? 0;
    }
  }

  // Expose formatted email drafts.
  if (email) {
    const data = asRecord(email.data);

    response.emailDraft = {
      subject: data.subject ?? "",
      body: data.body ?? "",
    };
  }

  // Expose structured market analysis.
  if (market && market.data) {
    response.marketAnalysis = market.data;
  }

  // Lightweight execution details for diagnostics.
  response.agentResults = result.results.map(item => ({
    agent: item.agent,
    route: item.route,
    count: item.count,
  }));

  return response;
}
