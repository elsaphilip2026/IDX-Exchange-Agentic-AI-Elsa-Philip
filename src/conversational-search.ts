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
}

export function handleSearchMessage(
  userId: string,
  message: string
): UserSession {
  // Allow the user to start over
  if (/\b(?:reset|start over|new search|clear)\b/i.test(message)) {
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

  /*
   * If we are still waiting for a city and the user replies
   * with a simple place name such as "Irvine", treat that
   * response as the city.
   */
  if (
    !currentSession.city &&
    !newFilters.city &&
    Object.keys(newFilters).length === 0 &&
    /^[A-Za-z][A-Za-z .'-]*$/.test(message.trim())
  ) {
    newFilters.city = message.trim();
  }

  // New/refined criteria should start again from page 1
  return updateSession(userId, {
    ...newFilters,
    page: 1,
    conversationStep: currentSession.conversationStep + 1,
  });
}

export async function searchFromConversation(
  userId: string,
  message: string
): Promise<ConversationalSearchResult> {
  const session = handleSearchMessage(userId, message);

  // Never query MLS until a city is available
  if (!session.city) {
    return {
      session,
      listings: [],
      needsCity: true,
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
