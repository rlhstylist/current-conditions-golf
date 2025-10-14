const NS = "ccg"

function k(part: string) {
  return `${NS}:${part}`
}

export function getJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(k(key))
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function setJSON<T>(key: string, value: T) {
  try {
    localStorage.setItem(k(key), JSON.stringify(value))
  } catch {}
}

export type PersistedPrefs = {
  courseName?: string
  manualCourse?: boolean
}

export function getPrefs(): PersistedPrefs {
  return getJSON<PersistedPrefs>("prefs", {})
}

export function setPrefs(next: PersistedPrefs) {
  const current = getPrefs()
  setJSON("prefs", { ...current, ...next })
}
