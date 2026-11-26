import { validatePropertyCity } from "./property-city-validator";
import { searchDynamicSemanticListings } from "./dynamic-semantic-search";
import {
  extractSemanticDescription,
  shouldClearSemanticDescription,
} from "./semantic-preference-parser";

import {
  parsePropertySearch,
  PropertyFilters,
} from "./property-search-parser";

import {
  getSession,
  updateSession,
  clearSession,
  UserSession,
} from "./session-memory";

import {
  searchActiveListings,
  ListingRow,
} from "./listing-search";

export interface ConversationalSearchResult {
  session: UserSession;
  listings: ListingRow[];
  needsCity: boolean;
  semanticSearch?: boolean;
  candidatePool?: number;
}

export function handleSearchMessage(
  userId: string,
  message: string
): UserSession {
  // Allow the user to start over
  if (/^(?:reset|start over|new search|clear|clear session|reset search)[.!?]*$/i.test(message.trim())) {
    clearSession(userId);
    return getSession(userId);
  }

  const currentSession = getSession(userId);

  // "Show me more" keeps the same filters and moves to the next page
  if (/\b(?:show me more|show more|more results|next page|more properties)\b/i.test(message)) {
    return updateSession(userId, {
      page: currentSession.page + 1,
      conversationStep: currentSession.conversationStep + 1,
    });
  }

  // Parse new search criteria normally
  const newFilters: PropertyFilters = parsePropertySearch(message);

  const description = extractSemanticDescription(message);

  const semanticDescription =
    shouldClearSemanticDescription(message)
      ? undefined
      : description
        ? [...new Set([
            ...(currentSession.semanticDescription?.split(", ") ?? []),
            ...description.split(", "),
          ])].join(", ")
        : currentSession.semanticDescription;

  /*
   * If we are still waiting for a city and the user replies
   * with a simple place name such as "Irvine", treat that
   * response as the city.
   */
  if (
    !currentSession.city &&
    !description &&
    !shouldClearSemanticDescription(message) &&
    !newFilters.city &&
    Object.keys(newFilters).length === 0 &&
    /^[A-Za-z][A-Za-z .'-]*$/.test(message.trim())
  ) {
    newFilters.city = message.trim();
  }

  // New/refined criteria should start again from page 1
  return updateSession(userId, {
    ...newFilters,
    semanticDescription,
    page: 1,
    conversationStep: currentSession.conversationStep + 1,
  });
}

export async function searchFromConversation(
  userId: string,
  message: string
): Promise<ConversationalSearchResult> {
  const currentSession = getSession(userId);
  const parsedFilters = parsePropertySearch(message);

  const isControlCommand =
    /\b(?:reset|start over|new search|clear|show more|show me more|more results|next page|more properties)\b/i.test(message);

  let candidateCity = parsedFilters.city;
  let validatedCity: string | null = null;

  // Recognize standalone cities even when a city is saved.
  if (
    !isControlCommand &&
    !extractSemanticDescription(message) &&
    !shouldClearSemanticDescription(message) &&
    !candidateCity &&
    Object.keys(parsedFilters).length === 0 &&
    /^[A-Za-z][A-Za-z .'-]*$/.test(message.trim())
  ) {
    candidateCity = message.trim();
  }

  // Validate the candidate city only once.
  if (candidateCity && !isControlCommand) {
    validatedCity = await validatePropertyCity(candidateCity);

    if (!validatedCity) {
      return {
        session: currentSession,
        listings: [],
        needsCity: true,
      };
    }

    if (!parsedFilters.city) {
      message = `Find homes in ${validatedCity}`;
    }
  }

  let session = handleSearchMessage(userId, message);

  // Store the canonical city name.
  if (validatedCity) {
    session = updateSession(userId, {
      city: validatedCity,
    });
  }

  // Never query MLS until a city is available
  if (!session.city) {
    return {
      session,
      listings: [],
      needsCity: true,
    };
  }

  // Apply remembered descriptive preferences after SQL filtering.
  if (session.semanticDescription) {
    const result = await searchDynamicSemanticListings(
      session.semanticDescription,
      session,
      session.page,
      5
    );

    updateSession(userId, {
      lastResults: result.results,
    });

    return {
      session: getSession(userId),
      listings: result.results,
      needsCity: false,
      semanticSearch: true,
      candidatePool: result.candidatePool,
    };
  }

  // Return 5 properties at a time using the remembered page
  const listings = await searchActiveListings(
    session,
    session.page,
    5
  );

  updateSession(userId, {
    lastResults: listings,
  });

  return {
    session: getSession(userId),
    listings,
    needsCity: false,
  };
}
