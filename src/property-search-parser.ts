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
  maxHoa?: number;
}

export function parsePropertySearch(query: string): PropertyFilters {
  const filters: PropertyFilters = {};
  const text = query.toLowerCase();

  // --------------------------------------------------
  // City
  // --------------------------------------------------
  const cityMatch = query.match(
    /\bin\s+([A-Za-z\s]+?)(?=\s+(?:under|below|over|above|with|at|for|having)\b|$)/i
  );

  if (cityMatch) {
    filters.city = cityMatch[1].trim();
  }

  // --------------------------------------------------
  // Bedrooms
  // Supports:
  // 3 bedroom
  // 3-bedroom
  // 3 beds
  // 3 br
  // --------------------------------------------------
  const bedroomMatch = text.match(
    /(\d+)[\s-]*(?:bedrooms?|beds?|br)\b/
  );

  if (bedroomMatch) {
    filters.bedrooms = Number(bedroomMatch[1]);
  }

  // --------------------------------------------------
  // Bathrooms
  // --------------------------------------------------
  const bathroomMatch = text.match(
    /(\d+(?:\.\d+)?)[\s-]*(?:bathrooms?|baths?|ba)\b/
  );

  if (bathroomMatch) {
    filters.bathrooms = Number(bathroomMatch[1]);
  }

  // --------------------------------------------------
  // HOA
  // Examples:
  // HOA under $500
  // HOA below 500
  // association fee under $400
  // max HOA $600
  // --------------------------------------------------
  const hoaMatch = text.match(
    /\b(?:hoa|association fee)\s*(?:(?:under|below|max(?:imum)?(?: of)?)\s*)?\$?([\d,.]+)\b/i
  );

  if (hoaMatch) {
    filters.maxHoa = Number(
      hoaMatch[1].replace(/,/g, "")
    );
  }

  // Remove HOA expression before parsing property price.
  // This prevents "HOA under $500" from becoming maxPrice.
  const textWithoutHoa = text.replace(
    /\b(?:hoa|association fee)\s*(?:(?:under|below|max(?:imum)?(?: of)?)\s*)?\$?[\d,.]+\b/gi,
    ""
  );

  // --------------------------------------------------
  // Maximum property price
  // --------------------------------------------------
  const maxPriceMatch = textWithoutHoa.match(
    /\b(?:under|below|less than|max(?:imum)?(?: of)?)\s*\$?([\d,.]+)\s*([km])?\b/i
  );

  if (maxPriceMatch) {
    filters.maxPrice = convertNumber(
      maxPriceMatch[1],
      maxPriceMatch[2]
    );
  }

  // --------------------------------------------------
  // Minimum property price
  // --------------------------------------------------
  const minPriceMatch = textWithoutHoa.match(
    /\b(?:over|above|more than|min(?:imum)?(?: of)?)\s*\$?([\d,.]+)\s*([km])?\b/i
  );

  if (minPriceMatch) {
    filters.minPrice = convertNumber(
      minPriceMatch[1],
      minPriceMatch[2]
    );
  }

  // --------------------------------------------------
  // Minimum square footage
  // --------------------------------------------------
  const minSqftMatch = text.match(
    /(?:at least|min(?:imum)?(?: of)?|over|above)\s*([\d,]+)\s*(?:sqft|sq ft|square feet)\b/i
  );

  if (minSqftMatch) {
    filters.minSqft = Number(
      minSqftMatch[1].replace(/,/g, "")
    );
  } else {
    const sqftMatch = text.match(
      /([\d,]+)\s*(?:sqft|sq ft|square feet)\b/i
    );

    if (sqftMatch) {
      filters.minSqft = Number(
        sqftMatch[1].replace(/,/g, "")
      );
    }
  }

  // --------------------------------------------------
  // Property type
  // --------------------------------------------------
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

  // --------------------------------------------------
  // Pool
  // --------------------------------------------------
  if (/\bpool\b/i.test(query)) {
    filters.pool = "True";
  }

  // --------------------------------------------------
  // View
  // --------------------------------------------------
  if (/\bview\b/i.test(query)) {
    filters.hasView = "True";
  }

  return filters;
}

// --------------------------------------------------
// Convert:
// 800k  -> 800000
// 1.5m  -> 1500000
// --------------------------------------------------
function convertNumber(
  value: string,
  suffix?: string
): number {
  let number = Number(
    value.replace(/,/g, "")
  );

  if (suffix?.toLowerCase() === "k") {
    number *= 1_000;
  }

  if (suffix?.toLowerCase() === "m") {
    number *= 1_000_000;
  }

  return number;
}
