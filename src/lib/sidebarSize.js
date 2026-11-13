export const SIDEBAR_STORAGE_KEY = 'gocost_sidebar_width'
export const SIDEBAR_MIN = 220
export const SIDEBAR_MAX = 340
export const SIDEBAR_DEFAULT = 240
export const SIDEBAR_COLLAPSED = 72
export const clampSidebarWidth = value => Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, value))
export function readSidebarWidth() {
  try {
    const saved = Number(localStorage.getItem(SIDEBAR_STORAGE_KEY))
    return Number.isFinite(saved) && saved >= SIDEBAR_MIN ? clampSidebarWidth(saved) : SIDEBAR_DEFAULT
  } catch { return SIDEBAR_DEFAULT }
}
