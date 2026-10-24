
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

  // Parse the new message normally
  const newFilters: PropertyFilters =
    parsePropertySearch(message);

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

  // Merge new criteria with everything already remembered
  return updateSession(userId, {
    ...newFilters,
    conversationStep: currentSession.conversationStep + 1,
  });
}


export async function searchFromConversation(
  userId: string,
  message: string
): Promise<ConversationalSearchResult> {
  const session = handleSearchMessage(userId, message);

  // Never query MLS until a city is available.
  if (!session.city) {
    return {
      session,
      listings: [],
      needsCity: true,
    };
  }

  const listings = await searchActiveListings(session, 1, 5);

  updateSession(userId, {
    lastResults: listings,
  });

  return {
    session: getSession(userId),
    listings,
    needsCity: false,
  };
}
