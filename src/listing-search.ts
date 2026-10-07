import { query } from "./mysql";
import { PropertyFilters } from "./property-search-parser";

export interface ListingRow {
  L_ListingID: string;
  L_DisplayId: string;
  L_Address: string;
  L_City: string;
  L_Zip: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  type: string;
  status: string;
  PoolPrivateYN: string;
  ViewYN: string;
}

export async function searchActiveListings(
  filters: PropertyFilters,
  page = 1,
  limit = 10
): Promise<ListingRow[]> {
  const offset = (page - 1) * limit;

  let sql = `
    SELECT
      L_ListingID,
      L_DisplayId,
      L_Address,
      L_City,
      L_Zip,
      L_SystemPrice AS price,
      L_Keyword2 AS beds,
      LM_Dec_3 AS baths,
      LM_Int2_3 AS sqft,
      L_Type_ AS type,
      L_Status AS status,
      PoolPrivateYN,
      ViewYN
    FROM rets_property
    WHERE L_Status = "Active"
  `;

  const params: any[] = [];

  if (filters.city) {
    sql += " AND L_City = ?";
    params.push(filters.city);
  }

  if (filters.minPrice) {
    sql += " AND L_SystemPrice >= ?";
    params.push(filters.minPrice);
  }

  if (filters.maxPrice) {
    sql += " AND L_SystemPrice <= ?";
    params.push(filters.maxPrice);
  }

  if (filters.bedrooms) {
    sql += " AND L_Keyword2 >= ?";
    params.push(filters.bedrooms);
  }

  if (filters.bathrooms) {
    sql += " AND LM_Dec_3 >= ?";
    params.push(filters.bathrooms);
  }

  if (filters.minSqft) {
    sql += " AND LM_Int2_3 >= ?";
    params.push(filters.minSqft);
  }

  if (filters.propertyType) {
    sql += " AND L_Type_ = ?";
    params.push(filters.propertyType);
  }

  if (filters.pool) {
    sql += " AND PoolPrivateYN = ?";
    params.push("1");
  }

  if (filters.hasView) {
    sql += " AND ViewYN = ?";
    params.push("1");
  }

  sql += " ORDER BY L_SystemPrice ASC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  return query<ListingRow>(sql, params);
}
