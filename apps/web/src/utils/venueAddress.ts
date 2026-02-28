/** Stored format: "street | city | state | zip" so we can parse for edit form. */
export const ADDRESS_DELIMITER = " | ";

export type AddressParts = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

export function combineAddress(parts: AddressParts): string {
  const { street, city, state, zip } = parts;
  return [street.trim(), city.trim(), state.trim(), zip.trim()].join(ADDRESS_DELIMITER);
}

export function parseAddress(address: string | undefined): AddressParts {
  if (!address || !address.includes(ADDRESS_DELIMITER)) {
    return { street: address?.trim() ?? "", city: "", state: "", zip: "" };
  }
  const parts = address.split(ADDRESS_DELIMITER);
  return {
    street: parts[0]?.trim() ?? "",
    city: parts[1]?.trim() ?? "",
    state: parts[2]?.trim() ?? "",
    zip: parts[3]?.trim() ?? "",
  };
}

/** For display in table and elsewhere: "street, city, state zip". */
export function formatAddressDisplay(address: string | undefined): string {
  if (!address) return "—";
  const parts = parseAddress(address);
  if (!parts.street && !parts.city && !parts.state && !parts.zip) return "—";
  const stateZip = [parts.state, parts.zip].filter(Boolean).join(" ");
  return [parts.street, parts.city, stateZip].filter(Boolean).join(", ");
}

/** Zip must be exactly 5 digits. */
export function isZipValid(zip: string): boolean {
  return /^\d{5}$/.test(zip.trim());
}

export const US_STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];
