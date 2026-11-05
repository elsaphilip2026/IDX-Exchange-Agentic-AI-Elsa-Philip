
import { getInventoryComparison } from "./market-statistics";

async function main() {
  try {
    const inventory = await getInventoryComparison("Irvine", 6);

    console.log("\n=== Irvine Inventory Comparison ===");
    console.table([inventory]);

    console.log(
      "\nNote: Inventory estimates depend on available sales history."
    );
  } catch (error) {
    console.error("Inventory comparison test failed:", error);
    process.exitCode = 1;
  }
}

main();
