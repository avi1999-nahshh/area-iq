/**
 * Display-name overrides for well-known Bangalore localities. India Post
 * names like "EPIP" or "Krishnarajapuram R S" hide the colloquial name
 * everyone actually uses. Map known pincodes to their popular name; for
 * pincodes not in this map, fall back to the raw `pincodes.name` value.
 */
export const BLR_ALIASES: Record<string, string> = {
  "560001": "Bangalore GPO",
  "560011": "Jayanagar III Block",
  "560016": "K R Puram",
  "560034": "Koramangala 1st Block",
  "560037": "Marathahalli",
  "560038": "Indiranagar",
  "560043": "HRBR Layout",
  "560048": "Whitefield (Mahadevapura)",
  "560050": "Banashankari",
  "560066": "Whitefield (EPIP)",
  "560067": "Whitefield",
  "560075": "New Thippasandra",
  "560076": "BTM Layout",
  "560077": "Kothanur",
  "560078": "JP Nagar",
  "560085": "Banashankari II / III Stage",
  "560090": "Chikkabanavara",
  "560092": "Yelahanka",
  "560095": "Koramangala 6th Block",
  "560100": "Electronic City Phase 1",
  "560102": "HSR Layout",
  "560103": "Bellandur",
  "560078b": "JP Nagar Phase 6",
};

export function displayName(pincode: string, fallback: string): string {
  return BLR_ALIASES[pincode] ?? fallback;
}
