import type { PropertyFilters } from "./property-search-parser";

export interface UserSession extends PropertyFilters {
  lastResults?: any[];
  conversationStep: number;
}

const sessions = new Map<string, UserSession>();

export function getSession(userId: string): UserSession {
  if (!sessions.has(userId)) {
    sessions.set(userId, {
      conversationStep: 0,
    });
  }

  return sessions.get(userId)!;
}

export function updateSession(
  userId: string,
  updates: Partial<UserSession>
): UserSession {
  const currentSession = getSession(userId);

  const updatedSession: UserSession = {
    ...currentSession,
    ...updates,
  };

  sessions.set(userId, updatedSession);

  return updatedSession;
}

export function clearSession(userId: string): void {
  sessions.delete(userId);
}
