
import type { ListingRow } from "./listing-search";

export function compareProperties(
  listings: ListingRow[],
  firstNumber: number,
  secondNumber: number
): string {
  const first = listings[firstNumber - 1];
  const second = listings[secondNumber - 1];

  if (!first || !second) {
    return "I couldn't find those property numbers in your latest search results.";
  }

  const money = (value: number | null | undefined) =>
    value == null
      ? "Unavailable"
      : `$${Number(value).toLocaleString("en-US")}`;

  const display = (value: number | string | null | undefined) =>
    value == null ? "Unavailable" : String(value);

  const formatHoa = (listing: ListingRow) =>
    `${money(listing.AssociationFee)} ${listing.AssociationFeeFrequency ?? ""}`.trim();

  return [
    `🏡 Property Comparison: ${firstNumber} vs ${secondNumber}`,
    "",
    `Address: ${first.L_Address} | ${second.L_Address}`,
    `Price: ${money(first.price)} | ${money(second.price)}`,
    `Bedrooms: ${display(first.beds)} | ${display(second.beds)}`,
    `Bathrooms: ${display(first.baths)} | ${display(second.baths)}`,
    `Square Feet: ${display(first.sqft)} | ${display(second.sqft)}`,
    `DOM: ${display(first.DaysOnMarket)} | ${display(second.DaysOnMarket)}`,
    `CDOM: ${display(first.CumulativeDaysOnMarket)} | ${display(second.CumulativeDaysOnMarket)}`,
    `HOA: ${formatHoa(first)} | ${formatHoa(second)}`,
    "",
    "Values are shown in the same order as the two selected properties.",
  ].join("\n");
}
