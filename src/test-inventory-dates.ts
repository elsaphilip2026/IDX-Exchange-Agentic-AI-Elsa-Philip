
import { query } from "./mysql";

async function main() {
  try {
    const rows = await query<{
      database_date: string;
      cutoff_date: string;
      earliest_sale: string;
      latest_sale: string;
      sold_homes: number;
    }>(`
      SELECT
        CURDATE() AS database_date,
        DATE_SUB(CURDATE(), INTERVAL 6 MONTH) AS cutoff_date,
        MIN(CloseDate) AS earliest_sale,
        MAX(CloseDate) AS latest_sale,
        COUNT(*) AS sold_homes
      FROM california_sold.california_sold
      WHERE City = ?
        AND PropertyType = 'Residential'
        AND ClosePrice > 0
        AND CloseDate >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        AND CloseDate <= CURDATE()
    `, ["Irvine"]);

    console.log("\n=== Irvine Inventory Sales Date Check ===");
    console.table(rows);
  } catch (error) {
    console.error("Inventory date check failed:", error);
    process.exitCode = 1;
  }
}

main();
