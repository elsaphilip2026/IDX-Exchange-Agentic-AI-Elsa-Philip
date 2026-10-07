import { query } from "./mysql";

async function testConnection() {
  try {
    const rows = await query("SELECT COUNT(*) AS count FROM rets_property");
    console.log("Database connection successful!");
    console.log(rows);
  } catch (error) {
    console.error("Database connection failed:");
    console.error(error);
  }
}

testConnection();
