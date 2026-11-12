/** A blank description is no description. Shared helper, not a use case. */
export function normalizeDescription(description: string | null | undefined): string | null {
  const trimmed = description?.trim()
  return trimmed ? trimmed : null
}
