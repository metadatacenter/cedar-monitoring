/**
 * What a page says when the report it reads could not be loaded, in the words the newer pages use:
 * "Could not read the host report (HTTP 500)." A request that got no answer has no status to give.
 */
export function loadFailure(what: string, error: unknown): string {
  const status = (error as { status?: number } | null | undefined)?.status;
  return `Could not read ${what}${status ? ` (HTTP ${status})` : ''}.`;
}
