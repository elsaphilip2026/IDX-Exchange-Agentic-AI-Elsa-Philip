import { ListingRow } from "./listing-search";
import { SoldRow } from "./sold-comps";

function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return `$${Number(value).toLocaleString("en-US")}`;
}

export function formatListingCard(listing: ListingRow): string {
  const pool =
    listing.PoolPrivateYN === "1" || listing.PoolPrivateYN === "True"
      ? "Yes"
      : "No";

  const view =
    listing.ViewYN === "1" || listing.ViewYN === "True"
      ? "Yes"
      : "No";

  return [
    `🏠 ${listing.L_Address}, ${listing.L_City} ${listing.L_Zip}`,
    `Price: ${formatPrice(listing.price)}`,
    `Beds: ${listing.beds} | Baths: ${listing.baths} | Sq Ft: ${listing.sqft}`,
    `Type: ${listing.type}`,
    `Pool: ${pool} | View: ${view}`,
    `Status: ${listing.status}`,
    `Listing ID: ${listing.L_DisplayId}`,
  ].join("\n");
}

export function formatListingCards(listings: ListingRow[]): string {
  if (listings.length === 0) {
    return "No matching active listings found.";
  }

  return listings.map(formatListingCard).join("\n\n");
}

export function formatSoldCard(sold: SoldRow): string {
  return [
    `🏡 ${sold.UnparsedAddress}, ${sold.City}`,
    `Sold Price: ${formatPrice(sold.ClosePrice)}`,
    `Close Date: ${sold.CloseDate}`,
    `Beds: ${sold.BedroomsTotal} | Baths: ${sold.BathroomsTotalInteger} | Sq Ft: ${sold.LivingArea}`,
    `Property Type: ${sold.PropertySubType}`,
    `List Price: ${formatPrice(sold.ListPrice)}`,
    `Days on Market: ${sold.DaysOnMarket}`,
  ].join("\n");
}

export function formatSoldCards(comps: SoldRow[]): string {
  if (comps.length === 0) {
    return "No sold comparable properties found.";
  }

  return comps.map(formatSoldCard).join("\n\n");
}
