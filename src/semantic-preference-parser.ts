export function extractSemanticDescription(
  message: string
): string | undefined {
  const pattern =
    /\b(?:mountain views?|ocean views?|backyards?|gardens?|modern|charming|spacious|renovated|luxury)\b/gi;

  const matches = message.match(pattern);

  if (!matches) {
    return undefined;
  }

  const preferences = [
    ...new Set(
      matches.map(match => match.toLowerCase())
    ),
  ];

  return preferences.join(", ");
}

export function shouldClearSemanticDescription(
  message: string
): boolean {
  return /^(?:remove|clear|forget)\s+(?:the\s+)?(?:descriptive|semantic|description)\s+(?:filters?|preferences?)[.!?]*$/i
    .test(message.trim());
}
