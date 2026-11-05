
import { getListingsForSemanticSearch } from "./semantic-listing-search";

export function keywordSimilarity(
  searchText: string,
  listingText: string
): number {
  const tokenize = (text: string): Set<string> =>
    new Set(
      text.toLowerCase()
        .match(/[a-z]+/g)
        ?.filter(word => word.length > 3) ?? []
    );

  const queryWords = tokenize(searchText);
  const listingWords = tokenize(listingText);

  if (queryWords.size === 0) return 0;

  let matches = 0;

  for (const word of queryWords) {
    if (listingWords.has(word)) {
      matches++;
    }
  }

  return matches / queryWords.size;
}

export async function searchListingsOffline(
      city: string,
  description: string,
  limit = 100
) {
  const listings = await getListingsForSemanticSearch(city, limit);

  return listings
    .map(listing => ({
      listingId: listing.L_ListingID,
      address: listing.L_Address,
      bedrooms: listing.L_Keyword2,
      bathrooms: listing.LM_Dec_3,
      sqft: listing.LM_Int2_3,
      city: listing.L_City,
      price: listing.L_SystemPrice,
      description: listing.L_Remarks,
      score: keywordSimilarity(description, listing.listingText),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
