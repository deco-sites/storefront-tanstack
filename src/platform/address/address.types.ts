/** A saved shipping/billing address. Field names follow schema.org PostalAddress. */
export interface Address {
  id: string;
  /** Friendly label, e.g. "Home" or "Work". */
  label?: string;
  /** Recipient full name. */
  recipient?: string;
  streetAddress?: string;
  /** City. */
  addressLocality?: string;
  /** State/region. */
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
  isDefault?: boolean;
}

export interface AddressBookState {
  addresses: Address[];
}

export const EMPTY_ADDRESS_BOOK: AddressBookState = { addresses: [] };
