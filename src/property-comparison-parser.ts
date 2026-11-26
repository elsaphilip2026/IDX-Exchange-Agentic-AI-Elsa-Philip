export interface PropertyComparisonRequest {
  firstNumber: number;
  secondNumber: number;
}

export function parsePropertyComparison(
  message: string
): PropertyComparisonRequest | null {

  const match = message.match(
    /\bcompare\s+(?:property|properties|listing|listings)?\s*(\d+)\s+(?:and|with|vs\.?|versus)\s+(?:property|properties|listing|listings)?\s*(\d+)\b/i
  );

  if (!match) {
    return null;
  }

  return {
    firstNumber: Number(match[1]),
    secondNumber: Number(match[2]),
  };
}
