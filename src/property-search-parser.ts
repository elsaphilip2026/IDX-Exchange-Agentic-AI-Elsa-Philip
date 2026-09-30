export interface PropertyFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minSqft?: number;
  maxSqft?: number;
  propertyType?: string;
}

export function parsePropertySearch(query: string): PropertyFilters {
  const filters: PropertyFilters = {};
  const text = query.toLowerCase();

  // Bedrooms
  const bedroomMatch = text.match(
    /(\d+)\s*(?:bedrooms?|beds?|br)\b/
  );

  if (bedroomMatch) {
    filters.bedrooms = Number(bedroomMatch[1]);
  }

  // Bathrooms
  const bathroomMatch = text.match(
    /(\d+(?:\.\d+)?)\s*(?:bathrooms?|baths?|ba)\b/
  );

  if (bathroomMatch) {
    filters.bathrooms = Number(bathroomMatch[1]);
  }

  // Maximum price
  const maxPriceMatch = text.match(
    /(?:under|below|less than|max(?:imum)?(?: of)?)\s*\$?([\d,.]+)\s*([km])?/
  );

  if (maxPriceMatch) {
    filters.maxPrice = convertNumber(
      maxPriceMatch[1],
      maxPriceMatch[2]
    );
  }

  // Minimum price
  const minPriceMatch = text.match(
    /(?:over|above|more than|min(?:imum)?(?: of)?)\s*\$?([\d,.]+)\s*([km])?/
  );

  if (minPriceMatch) {
    filters.minPrice = convertNumber(
      minPriceMatch[1],
      minPriceMatch[2]
    );
  }

  // Property type
  const propertyTypes = [
    "townhouse",
    "condo",
    "apartment",
    "house"
  ];

  for (const type of propertyTypes) {
    if (text.includes(type)) {
      filters.propertyType = type;
      break;
    }
  }

  return filters;
}

function convertNumber(value: string, suffix?: string): number {
  let number = Number(value.replace(/,/g, ""));

  if (suffix === "k") {
    number *= 1_000;
  } else if (suffix === "m") {
    number *= 1_000_000;
  }

  return number;
}
