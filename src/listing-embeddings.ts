
import OpenAI from "openai";

export interface EmbeddingListing {
  L_ListingID: string;
  L_Address: string | null;
  L_City: string;
  L_Type_: string | null;
  L_Keyword2: number | null;
  LM_Dec_3: number | null;
  LM_Int2_3: number | null;
  L_SystemPrice: number | null;
  L_Remarks: string | null;
}

export function buildListingText(listing: EmbeddingListing): string {
  return [
    `${listing.L_Type_ ?? "Property"} in ${listing.L_City}, California.`,
    `Bedrooms: ${listing.L_Keyword2 ?? "Unknown"}.`,
    `Bathrooms: ${listing.LM_Dec_3 ?? "Unknown"}.`,
    `Square feet: ${listing.LM_Int2_3 ?? "Unknown"}.`,
    `Price: $${listing.L_SystemPrice ?? "Unknown"}.`,
    listing.L_Remarks ?? "",
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);
}

export async function getEmbedding(
  text: string
): Promise<number[]> {
  const client = new OpenAI();

  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text.replace(/\s+/g, " ").trim().slice(0, 8000),
  });

  return response.data[0].embedding;
}
