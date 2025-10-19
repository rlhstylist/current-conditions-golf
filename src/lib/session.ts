const PROFILE_KEY = "ie:profile-id"

export function getProfileId(): string | null {
  if (typeof window === "undefined") return null
  try {
    const value = window.localStorage.getItem(PROFILE_KEY)
    return value && value.length > 0 ? value : null
  } catch (error) {
    console.warn("Unable to access profile id", error)
    return null
  }
}
