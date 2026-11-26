import { hasSearchComparisonConflict } from "./search-comparison-conflict";
import { clearSession, updateSession } from "./session-memory";
import { parsePropertyComparison } from "./property-comparison-parser";
import { createExecutionPlan } from "./agent-execution-planner";
import { decomposeQuery } from "./query-decomposer";

import type { AgentIntent } from "./intent-classifier";
import { classifyWithContext } from "./context-aware-intent";

import {
  executeAgent,
  type AgentResult,
  type AgentContext,
} from "./agent-registry";

export interface OrchestratorResult {
  intent: AgentIntent | "mixed" | "unknown";
  agents: AgentIntent[];
  route: string;
  reply: string;
  results: AgentResult[];
  executionTimeMs: number;
}

const agentTitles: Record<AgentIntent, string> = {
  search: "PROPERTY SEARCH RESULTS",
  market: "MARKET ANALYSIS",
  recommend: "PROPERTY RECOMMENDATIONS",
  knowledge: "REAL ESTATE KNOWLEDGE",
  email: "EMAIL DRAFT",
};

// Combine responses from multiple agents.
export function formatCombinedResponse(
  results: AgentResult[]
): string {
  return [
    "COMBINED REAL ESTATE REPORT",
    "",
    ...results.flatMap((result, index) => [
      `${index + 1}. ${agentTitles[result.agent]}`,
      "",
      result.reply,
      "",
    ]),
  ].join("\n").trim();
}

// Central Multi-Agent Orchestrator
export async function orchestrate(
  query: string,
  userId: string
): Promise<OrchestratorResult> {
  const startTime = Date.now();

  // Handle explicit session reset commands.
  if (/^(?:reset|start over|new search|clear|clear session|reset search)[.!?]*$/i.test(query.trim())) {
    clearSession(userId);

    return {
      intent: "unknown",
      agents: [],
      route: "session-reset",
      reply:
        "Your previous search and preferences have been cleared. Which city would you like to explore?",
      results: [],
      executionTimeMs: Date.now() - startTime,
    };
  }

  // Prevent comparisons against stale results when a new
  // property search or filter change is requested simultaneously.
  if (hasSearchComparisonConflict(query)) {
    return {
      intent: "unknown",
      agents: [],
      route: "search-comparison-clarification",
      reply:
        "You requested both a property search or refinement and a comparison. " +
        "Please complete the search first, then specify which property numbers " +
        "you would like to compare. This ensures I compare the correct listings.",
      results: [],
      executionTimeMs: Date.now() - startTime,
    };
  }

  const classification = await classifyWithContext(query, userId);

  const { intent, agents } = classification;

  // Handle unsupported or unknown requests.
  if (intent === "unknown") {
    return {
      intent,
      agents: [],
      route: "unknown",
      reply:
        "I can help you search for properties, analyze housing market trends, recommend similar homes, explain real estate concepts, or draft summary emails. What would you like to explore?",
      results: [],
      executionTimeMs: Date.now() - startTime,
    };
  }

  // Shared failure protection for all specialized agents.
  async function runTask(
    task: { agent: AgentIntent; query: string },
    comparisonListings?: AgentContext["comparisonListings"]
  ): Promise<AgentResult> {

    const isComparison =
      task.agent === "search" &&
      parsePropertyComparison(task.query) !== null;

    try {
      const result = await executeAgent(task.agent, {
        query: task.query,
        userId,
        comparisonListings,
      });

      // Clear outdated search results, but preserve comparison context.
      if (
        task.agent === "search" &&
        !isComparison &&
        (
          result.route !== "property-search" ||
          (result.count ?? 0) === 0
        )
      ) {
        updateSession(userId, {
          lastResults: [],
        });
      }

      return result;

    } catch (error) {
      console.error(
        `Agent execution failed: ${task.agent}`
      );

      if (task.agent === "search" && !isComparison) {
        updateSession(userId, {
          lastResults: [],
        });
      }

      return {
        agent: task.agent,
        route: "agent-error",
        reply:
          `The ${agentTitles[task.agent].toLowerCase()} ` +
          "could not be retrieved at this time. " +
          "Please try this part of your request again.",
        count: 0,
      };
    }
  }

  // Execute independent mixed-intent agents in parallel.
  if (intent === "mixed") {
    const tasks = decomposeQuery(query, agents);

    const plan = createExecutionPlan(tasks);

    // Phase 1: Execute independent agents in parallel.
    const independentResults = await Promise.all(
      plan.independent.map(task => runTask(task))
    );

    const searchResult = independentResults.find(
      result => result.agent === "search"
    );

    const searchSucceeded =
      searchResult !== undefined &&
      (
        searchResult.route === "property-search" ||
        searchResult.route === "property-comparison"
      ) &&
      (searchResult.count ?? 0) > 0;

    // Extract comparison-specific context without modifying session memory.
    const comparisonData =
      searchResult?.route === "property-comparison"
        ? searchResult.data as {
            comparisonSucceeded?: boolean;
            properties?: AgentContext["comparisonListings"];
          } | undefined
        : undefined;

    const comparisonListings =
      comparisonData?.comparisonSucceeded === true &&
      Array.isArray(comparisonData.properties) &&
      comparisonData.properties.length === 2
        ? comparisonData.properties
        : undefined;

    // Phase 2: Execute agents that require fresh search results.
    const dependentResults: AgentResult[] = [];

    for (const task of plan.dependent) {
      if (!searchSucceeded) {
        dependentResults.push({
          agent: task.agent,
          route: "dependency-skipped",
          reply:
            `The ${agentTitles[task.agent].toLowerCase()} ` +
            "could not be generated because the current " +
            "property search or comparison returned no usable results. " +
            "Please refine your request and try again.",
          count: 0,
        });

        continue;
      }

      dependentResults.push(
        await runTask(task, comparisonListings)
      );
    }

    // Preserve the original requested agent order.
    const allResults = [
      ...independentResults,
      ...dependentResults,
    ];

    const results = tasks.map(task =>
      allResults.find(
        result => result.agent === task.agent
      )!
    );

    return {
      intent: "mixed",
      agents,
      route: "multi-agent-orchestrator",
      reply: formatCombinedResponse(results),
      results,
      executionTimeMs: Date.now() - startTime,
    };
  }

  // Execute a single specialized agent.
  const result = await runTask({
    agent: intent,
    query,
  });

  return {
    intent,
    agents: [intent],
    route: result.route,
    reply: result.reply,
    results: [result],
    executionTimeMs: Date.now() - startTime,
  };
}
