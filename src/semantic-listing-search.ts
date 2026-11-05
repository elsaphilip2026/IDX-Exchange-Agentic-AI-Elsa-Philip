
import { query } from "./mysql";
import {
  buildListingText,
  EmbeddingListing,
} from "./listing-embeddings";

export interface SemanticListing extends EmbeddingListing {
  listingText: string;
}

export async function getListingsForSemanticSearch(
  city: string,
  limit = 10
): Promise<SemanticListing[]> {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);

  const sql = `
    SELECT
      L_ListingID,
      L_Address,
      L_City,
      L_Type_,
      L_Keyword2,
      LM_Dec_3,
      LM_Int2_3,
      L_SystemPrice,
      L_Remarks
    FROM rets_property
    WHERE L_Status = ?
      AND L_City = ?
      AND L_Remarks IS NOT NULL
      AND TRIM(L_Remarks) <> ?
    ORDER BY L_ListingID
    LIMIT ?
  `;

  const rows = await query<EmbeddingListing>(sql, [
    "Active",
    city,
    "",
    safeLimit,
  ]);

  return rows.map((listing) => ({
    ...listing,
    listingText: buildListingText(listing),
  }));
}
