
import { getCityMarketSummary } from "./market-statistics";

async function main() {
  try {
    const result = await getCityMarketSummary("Irvine", 12);

    if (!result) {
      console.log("No historical sales found for Irvine.");
      return;
    }

    console.log("\n=== Irvine Market Statistics ===");
    console.log("City:", result.city);
    console.log("Homes sold:", result.sold_count);
    console.log("Average sold price:", result.avg_close_price);
    console.log("Median sold price:", result.median_close_price);
    console.log("Average price per sqft:", result.avg_price_per_sqft);
    console.log("Average days on market:", result.avg_dom);
    console.log("List-to-close ratio:", result.list_to_close_pct);
  } catch (error) {
    console.error("Market statistics test failed:", error);
    process.exitCode = 1;
  }
}

main();
