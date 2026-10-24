import {
  parsePropertySearch,
  PropertyFilters
} from "../src/property-search-parser";

interface TestCase {
  query: string;
  expected: PropertyFilters;
}

const testCases: TestCase[] = [
  {
    query: "Find me a 3 bedroom house in Beverly Hills under $5m",
    expected: {
      city: "Beverly Hills",
      bedrooms: 3,
      maxPrice: 5000000,
      propertyType: "SingleFamilyResidence"
    }
  },
  {
    query: "Show me a 2 bed condo in Los Angeles below 800k",
    expected: {
      city: "Los Angeles",
      bedrooms: 2,
      maxPrice: 800000,
      propertyType: "Condominium"
    }
  },
  {
    query: "I want a 4 bedroom house in San Diego under 1m with a pool",
    expected: {
      city: "San Diego",
      bedrooms: 4,
      maxPrice: 1000000,
      propertyType: "SingleFamilyResidence",
      pool: "True"
    }
  },
  {
    query: "Find a 3 bed townhouse in Irvine over $700,000",
    expected: {
      city: "Irvine",
      bedrooms: 3,
      minPrice: 700000,
      propertyType: "Townhouse"
    }
  },
  {
    query: "Show me a single family home in Sacramento with 3 bedrooms and 2 bathrooms",
    expected: {
      city: "Sacramento",
      bedrooms: 3,
      bathrooms: 2,
      propertyType: "SingleFamilyResidence"
    }
  },
  {
    query: "Find a 4 bed 3 bath house under $750,000 with a view",
    expected: {
      bedrooms: 4,
      bathrooms: 3,
      maxPrice: 750000,
      propertyType: "SingleFamilyResidence",
      hasView: "True"
    }
  },
  {
    query: "Show me a 3 bedroom 2 bathroom condo in San Jose below 900k",
    expected: {
      city: "San Jose",
      bedrooms: 3,
      bathrooms: 2,
      maxPrice: 900000,
      propertyType: "Condominium"
    }
  },
  {
    query: "I need a 5 bedroom house with at least 2500 sq ft",
    expected: {
      bedrooms: 5,
      minSqft: 2500,
      propertyType: "SingleFamilyResidence"
    }
  },
  {
    query: "Find a 2 bed 1.5 bath condo under 650k with a pool",
    expected: {
      bedrooms: 2,
      bathrooms: 1.5,
      maxPrice: 650000,
      propertyType: "Condominium",
      pool: "True"
    }
  },
  {
    query:
      "Show me 3-bedroom condos in Irvine under $1.5M with a pool and HOA under $500",
    expected: {
      city: "Irvine",
      bedrooms: 3,
      maxPrice: 1500000,
      propertyType: "Condominium",
      pool: "True",
      maxHoa: 500
    }
  },
      {
    query: "Find me a 3 bedroom house under $5 million",
    expected: {
      bedrooms: 3,
      maxPrice: 5000000,
      propertyType: "SingleFamilyResidence"
    }
  }
];

let passed = 0;

testCases.forEach((test, index) => {
  const result = parsePropertySearch(test.query);

  const success = Object.entries(test.expected).every(
  ([key, value]) =>
    result[key as keyof PropertyFilters] === value
);

  console.log(`\nTest ${index + 1}: ${test.query}`);

  if (success) {
    console.log("PASS");
    passed++;
  } else {
    console.log("FAIL");
    console.log("Expected:", test.expected);
    console.log("Received:", result);
  }
});

console.log("\n------------------------------");
console.log(`Results: ${passed}/${testCases.length} tests passed`);
console.log("------------------------------");

if (passed !== testCases.length) {
  process.exit(1);
}
