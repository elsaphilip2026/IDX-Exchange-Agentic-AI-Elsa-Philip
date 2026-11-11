import { query } from "./mysql";

interface CompSummaryRow {
  avg_ppsf: number | string | null;
  comp_count: number;
  latest_close_date: string | Date | null;
}

export interface CompValidation {
  city: string;
  listPrice: number;
  estimatedCompPrice: number | null;
  compCount: number;
  deltaPct: number | null;
  latestCloseDate: string | null;
  assessment: string;
}

export async function validateRecommendationPrice(
  city: string,
  sqft: number,
  price: number
): Promise<CompValidation> {
  if (!city.trim() || sqft <= 0 || price <= 0) {
    throw new Error("Valid city, square footage, and price are required.");
  }

  const sql = `
    SELECT
      AVG(ClosePrice / NULLIF(LivingArea, 0)) AS avg_ppsf,
      COUNT(*) AS comp_count,
      MAX(CloseDate) AS latest_close_date
    FROM california_sold.california_sold
    WHERE City = ?
      AND PropertyType = 'Residential'
      AND LivingArea BETWEEN ? AND ?
      AND CloseDate >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      AND CloseDate <= CURDATE()
      AND ClosePrice > 0
      AND LivingArea > 0
  `;

  const rows = await query<CompSummaryRow>(sql, [
    city,
    sqft * 0.8,
    sqft * 1.2,
  ]);

  const result = rows[0];
  const compCount = Number(result?.comp_count ?? 0);
  const avgPpsf = Number(result?.avg_ppsf ?? 0);

  const latestCloseDate = result?.latest_close_date
    ? new Date(result.latest_close_date).toISOString().slice(0, 10)
    : null;

  if (compCount === 0 || !Number.isFinite(avgPpsf) || avgPpsf <= 0) {
    return {
      city,
      listPrice: price,
      estimatedCompPrice: null,
      compCount,
      deltaPct: null,
      latestCloseDate,
      assessment: "Insufficient recent comparable sales data",
    };
  }

  const estimatedCompPrice = Math.round(avgPpsf * sqft);
  const deltaPct = Math.round(
    ((price - estimatedCompPrice) / estimatedCompPrice) * 1000
  ) / 10;

  return {
    city,
    listPrice: price,
    estimatedCompPrice,
    compCount,
    deltaPct,
    latestCloseDate,
    assessment:
      deltaPct > 10
        ? "Asking price is above the comparable-sales estimate"
        : deltaPct < -10
          ? "Asking price is below the comparable-sales estimate"
          : "Asking price is near the comparable-sales estimate",
  };
}
