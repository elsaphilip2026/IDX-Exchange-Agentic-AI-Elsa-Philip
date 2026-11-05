
import { query } from "./mysql";

async function main() {
  try {
    const rows = await query<{
      earliest_sale: string;
      latest_sale: string;
      total_sales: number;
    }>(`
      SELECT
        MIN(CloseDate) AS earliest_sale,
        MAX(CloseDate) AS latest_sale,
        COUNT(*) AS total_sales
      FROM california_sold.california_sold
      WHERE City = ?
        AND PropertyType = 'Residential'
    `, ["Irvine"]);

    console.log("Irvine historical data coverage:");
    console.table(rows);
  } catch (error) {
    console.error("Data coverage test failed:", error);
    process.exitCode = 1;
  }
}

main();
