import { validateRecommendationPrice } from "./recommendation-comps";

async function main() {
  const result = await validateRecommendationPrice(
    "Irvine",
    1800,
    1100000
  );

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Recommendation comps test failed:", error);
  process.exitCode = 1;
});
