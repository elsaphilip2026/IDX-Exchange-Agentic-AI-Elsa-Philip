import { query } from "./mysql";

interface CityRow {
  city: string;
}

export async function validatePropertyCity(
  candidate: string
): Promise<string | null> {

  const city = candidate.trim().replace(/[.!?,;]+$/, "").trim();

  if (!city || city.length > 100) {
    return null;
  }

  if (!/^[A-Za-z][A-Za-z .'-]*$/.test(city)) {
    return null;
  }

  const rows = await query<CityRow>(
    `
    SELECT DISTINCT L_City AS city
    FROM rets_property
    WHERE L_Status = 'Active'
      AND LOWER(TRIM(L_City)) = LOWER(?)
    LIMIT 1
    `,
    [city]
  );

  return rows[0]?.city?.trim() || null;
}
