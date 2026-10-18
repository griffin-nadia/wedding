// "Where are you flying from?" quick chips (final run), shown before anything's typed. One per line, as "City, CC" or
// "City, Region, CC" (GeoNames names). Griffin and Nadia to confirm the list; after changing it, run
// node scripts/cities-build.mjs, which resolves each to its city (src/data/flying-chips.json).
export const CHIPS = [
  "Brisbane, AU", "Melbourne, AU", "Sydney, AU", "Adelaide, AU", "Perth, AU",
  "Vancouver, CA", "Victoria, British Columbia, CA", "Calgary, CA", "Edmonton, CA", "Toronto, CA",
  "Already in Japan",
]
