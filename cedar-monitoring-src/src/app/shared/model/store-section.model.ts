/**
 * One store's part of a diagnostic report. Where the store could not be read, its value is null and
 * `unavailable` says why; where it was read, `unavailable` is absent, so a null value is the store
 * holding nothing.
 */
export interface StoreSection {
  unavailable?: string;
  [value: string]: unknown;
}

/**
 * What a report card shows for one store's value: the value, or the whole section where the store
 * could not be read, so the reason is on the card rather than a null that reads as "not indexed".
 */
export function storeView(section: StoreSection | null | undefined, value: string): unknown {
  if (section?.unavailable) {
    return section;
  }
  return section?.[value];
}
