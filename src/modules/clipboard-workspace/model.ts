export const MAX_CLIPBOARD_LENGTH = 10_000
export const PASSWORD_STORAGE_KEY = "password"

export const normalizeClipboardText = (value: string): string =>
  value.slice(0, MAX_CLIPBOARD_LENGTH)

export const normalizePassword = (value: string): string =>
  value.trim()

export const normalizeOptionalPassword = (
  value: string | null,
): string | null => {
  if (value === null) {
    return null
  }

  const normalized = normalizePassword(value)
  return normalized.length > 0 ? normalized : null
}

export const hasPassword = (value: string | null): value is string =>
  normalizeOptionalPassword(value) !== null
