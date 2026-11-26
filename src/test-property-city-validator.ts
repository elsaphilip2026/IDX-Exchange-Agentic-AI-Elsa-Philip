import assert from "node:assert/strict";
import { validatePropertyCity } from "./property-city-validator";

async function main() {
  const cases = [
    { input: "Irvine", expected: "Irvine" },
    { input: "Pasadena", expected: "Pasadena" },
    { input: "irvine", expected: "Irvine" },
    { input: "Pasadena.", expected: "Pasadena" },
    { input: "Hello", expected: null },
    { input: "Good morning", expected: null },
    { input: "Find me affordable homes", expected: null },
    {
      input: "Find homes in Pasadena and show market trends",
      expected: null
    },
    { input: "", expected: null }
  ];

  console.log("\n===== CITY VALIDATION TESTS =====\n");

  for (const item of cases) {
    const result = await validatePropertyCity(item.input);

    console.log({
      input: item.input,
      result,
      expected: item.expected
    });

    assert.equal(result, item.expected);

    console.log("PASS\n");
  }

  console.log("ALL 9 CITY VALIDATION TESTS PASSED");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("City validation test failed:", error);
    process.exit(1);
  });
