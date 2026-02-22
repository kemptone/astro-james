// Parental Control System
// Provides code-based access control for restricted routes

export const MASTER_CODE = '202603' // Master code that works for all pages
export const SRO_CODE = '909099'
const STORAGE_PREFIX = 'JAMES_PARENTAL_' // Prefix for localStorage keys

/**
 * Get the storage key for a specific route
 */
function getStorageKey(route: string): string {
  return `${STORAGE_PREFIX}${route}`
}

/**
 * Check if a page is unlocked in localStorage by comparing stored code with required code
 */
export function isPageUnlocked(route: string, requiredCode: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    const storageKey = getStorageKey(route)
    return localStorage.getItem(storageKey) === requiredCode
  } catch {
    return false
  }
}

/**
 * Unlock a page and store the required code in localStorage
 */
export function unlockPage(route: string, requiredCode: string): void {
  if (typeof window === 'undefined') return

  try {
    const storageKey = getStorageKey(route)
    localStorage.setItem(storageKey, requiredCode)
  } catch (e) {
    console.error('Failed to unlock page:', e)
  }
}

/**
 * Validate code against route's required code or master code
 * @returns Object with validation status and whether master code was used
 */
export function validateCode(
  inputCode: string,
  requiredCode: string,
  route: string
): { valid: boolean; isMaster: boolean } {
  const isSRORoute = route.indexOf('sro') > -1
  const isMaster = inputCode === MASTER_CODE
  const isCorrect = inputCode === requiredCode
  const isSROCode = inputCode === SRO_CODE

  if (isMaster || isCorrect || (isSROCode && isSRORoute)) {
    // Always store the page's actual required code in localStorage
    unlockPage(route, requiredCode)
    return { valid: true, isMaster }
  }

  return { valid: false, isMaster: false }
}

/**
 * Clear all unlocked pages (for reinstall feature)
 */
export function clearUnlockedPages(): void {
  if (typeof window === 'undefined') return

  // Remove all keys that start with the parental control prefix
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key))
}
