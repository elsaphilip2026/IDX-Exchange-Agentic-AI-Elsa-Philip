import {
  classifyIntent,
  type IntentClassification,
} from "./intent-classifier";

import { getSession } from "./session-memory";
import { validatePropertyCity } from "./property-city-validator";

export async function classifyWithContext(
  query: string,
  userId: string
): Promise<IntentClassification> {

  const classification = classifyIntent(query);

  // Preserve recognized intents.
  if (classification.intent !== "unknown") {
    return classification;
  }

  const session = getSession(userId);
  const message = query.trim();

  // Recognize standalone city names.
  if (/^[A-Za-z][A-Za-z .'-]*$/.test(message)) {
    const city = await validatePropertyCity(message);

    if (city) {
      return {
        intent: "search",
        agents: ["search"],
      };
    }
  }

  // Recognize short market follow-up questions.
  if (
    session.city &&
    /^(?:how is the market|how are prices|market update|market report|market trends)[.!?]*$/i.test(message)
  ) {
    return {
      intent: "market",
      agents: ["market"],
    };
  }

  // Preserve unknown intent for unsupported requests.
  return classification;
}
