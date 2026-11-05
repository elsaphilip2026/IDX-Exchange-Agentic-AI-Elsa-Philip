
import { getMonthlyPriceTrend } from "./market-statistics";


async function main() {
  try {
    const trends = await getMonthlyPriceTrend("Irvine", 12);

    console.log("\n=== Irvine Monthly Market Trends ===");

    if (trends.length === 0) {
      console.log("No historical sales found.");
      return;
    }

    console.table(trends);
  } catch (error) {
    console.error("Market trend test failed:", error);
    process.exitCode = 1;
  }
}

main();
