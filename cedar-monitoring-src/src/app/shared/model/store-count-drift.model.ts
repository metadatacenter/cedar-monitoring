import {CedarMonitoring} from "./cedar-monitoring.model";

/** What one cross-store count comparison came to. */
export type DriftStatus = 'OK' | 'DRIFT' | 'UNVERIFIED' | 'UNAVAILABLE' | 'NOT_CHECKED';

/**
 * One store's count read against another's, with the rule that says what the second one ought to be.
 *
 * <p>The counts table used to put the stores side by side and leave the arithmetic to the reader.
 * Two of its gaps are expected and permanent — the search index holds no user home or system
 * folders, and a Keycloak account only becomes a CEDAR user node on first sign-in — so the page
 * showed thousands of resources' worth of difference that nobody should act on, in the same
 * typeface as the differences that matter.
 */
export class StoreCountDrift extends CedarMonitoring {
  id: string = '';
  resourceType: string = '';
  authority: string = '';
  authorityCount: number = 0;
  compared: string = '';
  comparedCount: number = 0;
  /** What `comparedCount` should be. Absent where no exact rule gives it. */
  expected: number | null = null;
  /**
   * `comparedCount - authorityCount`: the whole difference, before any rule is applied. On the
   * folder row this is -5661 while `drift` is 0, which is the distinction the column exists to draw.
   */
  gap: number = 0;
  /** `comparedCount - expected`. Signed: which way it leans says which failure happened. */
  drift: number | null = null;
  status: DriftStatus = 'UNVERIFIED';
  /**
   * A few words saying what the check came to - "index in step", "80 orphaned documents". Written
   * per check by the server rather than composed here from the side names and the number, which
   * produced labels like "parts 0" that only meant something to someone who knew the rule.
   */
  label: string = '';
  rule: string = '';
  note: string | null = null;
}

export class StoreCountDriftReport extends CedarMonitoring {
  checks: StoreCountDrift[] = [];
  totalChecks: number = 0;
  driftingChecks: number = 0;
  unverifiedChecks: number = 0;
  unavailableChecks: number = 0;
}
