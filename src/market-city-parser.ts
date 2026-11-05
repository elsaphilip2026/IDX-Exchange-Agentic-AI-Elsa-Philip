import { query } from "./mysql";

interface CityRow {
  city: string;
}

let cachedCities: string[] | null = null;

export async function detectMarketCity(
  message: string
): Promise<string | null> {
  if (!cachedCities) {
    const rows = await query<CityRow>(`
      SELECT DISTINCT City AS city
      FROM california_sold.california_sold
      WHERE City IS NOT NULL
        AND TRIM(City) <> ''
    `);

    cachedCities = rows.map((row) => row.city.trim())
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
  }

  for (const city of cachedCities) {
    const escaped = city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const pattern = new RegExp(
      `(^|[^a-z])${escaped}(?=$|[^a-z])`,
      "i"
    );

    if (pattern.test(message)) {
      return city;
    }
  }

  return null;
}
