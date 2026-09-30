export interface PropertyFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minSqft?: number;
  maxSqft?: number;
  propertyType?: string;
  pool?: string;
  hasView?: string;
}

export function parsePropertySearch(query: string): PropertyFilters {
  const filters: PropertyFilters = {};
  const text = query.toLowerCase();

  // City
  const cityMatch = query.match(
    /\bin\s+([A-Za-z\s]+?)(?=\s+(?:under|below|over|above|with|at|for|having)\b|$)/i
  );

  if (cityMatch) {
    filters.city = cityMatch[1].trim();
  }

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

  // Minimum square footage
  const minSqftMatch = text.match(
    /(?:at least|min(?:imum)?(?: of)?|over|above)\s*([\d,]+)\s*(?:sqft|sq ft|square feet)/
  );

  if (minSqftMatch) {
    filters.minSqft = Number(minSqftMatch[1].replace(/,/g, ""));
  } else {
    const sqftMatch = text.match(
      /([\d,]+)\s*(?:sqft|sq ft|square feet)/
    );

    if (sqftMatch) {
      filters.minSqft = Number(sqftMatch[1].replace(/,/g, ""));
    }
  }

  // Property type mapped to MLS values
  const propertyTypeMap: Record<string, string> = {
    townhouse: "Townhouse",
    townhome: "Townhouse",
    condo: "Condominium",
    condominium: "Condominium",
    "single family": "SingleFamilyResidence",
    house: "SingleFamilyResidence",
    land: "UnimprovedLand"
  };

  for (const [term, mlsValue] of Object.entries(propertyTypeMap)) {
    if (text.includes(term)) {
      filters.propertyType = mlsValue;
      break;
    }
  }

  // Pool
  if (/\bpool\b/i.test(query)) {
    filters.pool = "True";
  }

  // View
  if (/\bview\b/i.test(query)) {
    filters.hasView = "True";
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
