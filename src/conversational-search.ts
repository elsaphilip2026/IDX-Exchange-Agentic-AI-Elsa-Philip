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

export function handleSearchMessage(
  userId: string,
  message: string
): UserSession {

  // Allow the user to start over
  if (
    /\b(?:reset|start over|new search|clear)\b/i.test(message)
  ) {
    clearSession(userId);
    return getSession(userId);
  }

  // Parse only the new message
  const newFilters: PropertyFilters =
    parsePropertySearch(message);

  // Get everything we already remember
  const currentSession = getSession(userId);

  // Merge the newly discovered filters into memory
  return updateSession(userId, {
    ...newFilters,
    conversationStep:
      currentSession.conversationStep + 1,
  });
}
import {
  searchActiveListings,
  ListingRow,
} from "./listing-search";

export interface ConversationalSearchResult {
  session: UserSession;
  listings: ListingRow[];
}

export async function searchFromConversation(
  userId: string,
  message: string
): Promise<ConversationalSearchResult> {

  // Parse the new message and update memory
  const session = handleSearchMessage(
    userId,
    message
  );

  // Query MLS using everything remembered so far
  const listings = await searchActiveListings(
    session,
    1,
    5
  );

  // Remember the latest results
  updateSession(userId, {
    lastResults: listings,
  });

  return {
    session: getSession(userId),
    listings,
  };
}
