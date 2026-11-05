
import { query } from "./mysql";

export interface CityMarketSummary {
  city: string;
  sold_count: number;
  avg_close_price: number | null;
  median_close_price: number | null;
  avg_price_per_sqft: number | null;
  avg_dom: number | null;
  list_to_close_pct: number | null;
}

export async function getCityMarketSummary(
  city: string,
  months = 12
): Promise<CityMarketSummary | null> {
  if (!city.trim()) {
    throw new Error("City is required");
  }

  if (!Number.isInteger(months) || months < 1 || months > 60) {
    throw new Error("Months must be between 1 and 60");
  }

  const sql = `
    SELECT
      City AS city,
      COUNT(*) AS sold_count,
      ROUND(AVG(ClosePrice), 0) AS avg_close_price,
      ROUND(AVG(
        CASE
          WHEN LivingArea > 0
          THEN ClosePrice / LivingArea
          ELSE NULL
        END
      ), 0) AS avg_price_per_sqft,
      ROUND(AVG(DaysOnMarket), 1) AS avg_dom,
      ROUND(AVG(
        CASE
          WHEN ListPrice > 0
          THEN ClosePrice / ListPrice
          ELSE NULL
        END
      ) * 100, 1) AS list_to_close_pct
    FROM california_sold.california_sold
    WHERE City = ?
      AND PropertyType = 'Residential'
      AND CloseDate >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
      AND ClosePrice > 0
    GROUP BY City
  `;

  const results = await query<
    Omit<CityMarketSummary, "median_close_price">
  >(sql, [city.trim(), months]);

  if (results.length === 0) {
    return null;
  }

  const medianSql = `
    SELECT ClosePrice
    FROM california_sold.california_sold
    WHERE City = ?
      AND PropertyType = 'Residential'
      AND CloseDate >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
      AND ClosePrice > 0
    ORDER BY ClosePrice
  `;

  const prices = await query<{ ClosePrice: number }>(
    medianSql,
    [city.trim(), months]
  );

  const middle = Math.floor(prices.length / 2);

  const median =
    prices.length % 2 === 0
      ? (Number(prices[middle - 1].ClosePrice) +
          Number(prices[middle].ClosePrice)) / 2
      : Number(prices[middle].ClosePrice);

  return {
    ...results[0],
    median_close_price: Math.round(median),
  };
}

export interface MonthlyPriceTrend {
  month: string;
  sales: number;
  avg_price: number | null;
  avg_price_per_sqft: number | null;
  avg_dom: number | null;
  price_change_pct: number | null;
}

export async function getMonthlyPriceTrend(
  city: string,
  months = 12
): Promise<MonthlyPriceTrend[]> {
  if (!city.trim()) {
    throw new Error("City is required");
  }

  if (!Number.isInteger(months) || months < 1 || months > 60) {
    throw new Error("Months must be between 1 and 60");
  }

  const sql = `
    SELECT
      DATE_FORMAT(CloseDate, '%Y-%m') AS month,
      COUNT(*) AS sales,
      ROUND(AVG(ClosePrice), 0) AS avg_price,
      ROUND(AVG(
        ClosePrice / NULLIF(LivingArea, 0)
      ), 0) AS avg_price_per_sqft,
      ROUND(AVG(DaysOnMarket), 1) AS avg_dom
    FROM california_sold.california_sold
    WHERE City = ?
      AND PropertyType = 'Residential'
      AND CloseDate >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
      AND ClosePrice > 0
    GROUP BY DATE_FORMAT(CloseDate, '%Y-%m')
    ORDER BY month ASC
  `;

  const rows = await query<
    Omit<MonthlyPriceTrend, "price_change_pct">
  >(sql, [city.trim(), months]);

  return rows.map((row, index) => {
    const previousPrice =
      index > 0 ? Number(rows[index - 1].avg_price) : 0;

    const currentPrice = Number(row.avg_price);

    const priceChange =
      index > 0 && previousPrice > 0
        ? Math.round(
            ((currentPrice - previousPrice) / previousPrice) *
              10000
          ) / 100
        : null;

    return {
      ...row,
      price_change_pct: priceChange,
    };
  });
}

export interface MarketDataCoverage {
  city: string;
  earliest_sale: string | null;
  latest_sale: string | null;
  total_sales: number;
  available_months: number;
  has_full_12_months: boolean;
}

export async function getMarketDataCoverage(
  city: string
): Promise<MarketDataCoverage> {
  if (!city.trim()) {
    throw new Error("City is required");
  }

  const sql = `
    SELECT
      MIN(CloseDate) AS earliest_sale,
      MAX(CloseDate) AS latest_sale,
      COUNT(*) AS total_sales
    FROM california_sold.california_sold
    WHERE City = ?
      AND PropertyType = 'Residential'
      AND ClosePrice > 0
      AND CloseDate <= CURDATE()
  `;

  const rows = await query<{
    earliest_sale: string | null;
    latest_sale: string | null;
    total_sales: number;
  }>(sql, [city.trim()]);

  const result = rows[0];

  const earliest = result.earliest_sale
    ? String(result.earliest_sale).slice(0, 10)
    : null;

  const latest = result.latest_sale
    ? String(result.latest_sale).slice(0, 10)
    : null;

  const availableMonths =
    earliest && latest
      ? Math.round(
          (new Date(latest).getTime() -
            new Date(earliest).getTime()) /
            (1000 * 60 * 60 * 24 * 30.44)
        )
      : 0;

  return {
    city: city.trim(),
    earliest_sale: earliest,
    latest_sale: latest,
    total_sales: Number(result.total_sales),
    available_months: availableMonths,
    has_full_12_months: availableMonths >= 12,
  };
}

export interface InventoryComparison {
  city: string;
  active_listings: number;
  sold_homes: number;
  months_analyzed: number;
  avg_monthly_sales: number;
  months_of_inventory: number | null;
}

export async function getInventoryComparison(
  city: string,
  months = 6
): Promise<InventoryComparison> {
  if (!city.trim()) {
    throw new Error("City is required");
  }

  if (!Number.isInteger(months) || months < 1 || months > 60) {
    throw new Error("Months must be between 1 and 60");
  }

  const activeSql = `
    SELECT COUNT(*) AS total
    FROM rets_property
    WHERE L_City = ?
      AND L_Status = 'Active'
  `;

  const soldSql = `
    SELECT COUNT(*) AS total
    FROM california_sold.california_sold
    WHERE City = ?
      AND PropertyType = 'Residential'
      AND ClosePrice > 0
      AND CloseDate >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
      AND CloseDate <= CURDATE()
  `;

  const [activeRows, soldRows] = await Promise.all([
    query<{ total: number }>(activeSql, [city.trim()]),
    query<{ total: number }>(soldSql, [city.trim(), months]),
  ]);

  const activeListings = Number(activeRows[0]?.total ?? 0);
  const soldHomes = Number(soldRows[0]?.total ?? 0);

  const avgMonthlySales = soldHomes / months;

  const coverage = await getMarketDataCoverage(city);

const today = new Date();
const cutoff = new Date(today);
cutoff.setMonth(today.getMonth() - months);

const latestAllowedAge = new Date(today);
latestAllowedAge.setDate(today.getDate() - 7);

const hasCompleteCoverage =
  coverage.earliest_sale !== null &&
  coverage.latest_sale !== null &&
  new Date(coverage.earliest_sale).getTime() <= cutoff.getTime() &&
  new Date(coverage.latest_sale).getTime() >= latestAllowedAge.getTime();

const monthsOfInventory =
  hasCompleteCoverage && avgMonthlySales > 0
    ? Math.round((activeListings / avgMonthlySales) * 100) / 100
    : null;

  return {
    city: city.trim(),
    active_listings: activeListings,
    sold_homes: soldHomes,
    months_analyzed: months,
    avg_monthly_sales: Math.round(avgMonthlySales * 10) / 10,
    months_of_inventory: monthsOfInventory,
  };
}
