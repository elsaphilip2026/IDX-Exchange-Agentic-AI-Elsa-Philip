
import { getMarketDataCoverage } from "./market-statistics";

async function main() {
  try {
    const coverage = await getMarketDataCoverage("Irvine");

    console.log("\n=== Irvine Market Data Coverage ===");
    console.table([coverage]);

    if (!coverage.has_full_12_months) {
      console.log(
        "\nNote: Less than 12 months of sales history is available."
      );
    }
  } catch (error) {
    console.error("Market coverage test failed:", error);
    process.exitCode = 1;
  }
}

main();
