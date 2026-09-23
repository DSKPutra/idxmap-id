/**
 * Normalizes an investor name from a KSEI report so the same investor
 * reported slightly differently across months (extra spacing, "PT" vs "PT.",
 * trailing "Tbk", case differences) collapses to one canonical key used for
 * de-duplication before upserting into `investors.name_normalized`.
 */
export function normalizeInvestorName(rawName: string): string {
  return rawName
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\(data fiktif\)/g, '')
    .replace(/\bpt\.?\b/g, 'pt')
    .replace(/\btbk\.?\b/g, '')
    .replace(/[.,]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
