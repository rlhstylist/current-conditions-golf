import { getProfileId } from "@/lib/session"
import { isSupabaseReady, rpc } from "@/lib/supabase"

const LS_PROGRAM = "ie:program-notes"

export type ProgramDoc = {
  notes: string
  updated_at: string
}

export async function getProgram(): Promise<ProgramDoc | null> {
  if (isSupabaseReady()) {
    const profileId = getProfileId()
    if (!profileId) return null
    const { data, error } = await rpc<ProgramDoc>("rpc_get_program", { p_profile: profileId })
    if (error) throw error
    return data
  }

  const storage = getLocalStorage()
  if (!storage) {
    return { notes: "", updated_at: new Date().toISOString() }
  }

  try {
    const notes = storage.getItem(LS_PROGRAM) ?? ""
    return { notes, updated_at: new Date().toISOString() }
  } catch {
    return { notes: "", updated_at: new Date().toISOString() }
  }
}

export async function setProgram(notes: string): Promise<ProgramDoc | null> {
  if (isSupabaseReady()) {
    const profileId = getProfileId()
    if (!profileId) throw new Error("Missing profile id")
    const { data, error } = await rpc<ProgramDoc>("rpc_set_program", { p_profile: profileId, p_notes: notes })
    if (error) throw error
    return data
  }

  const storage = getLocalStorage()
  if (!storage) {
    throw new Error("Local storage unavailable")
  }

  try {
    storage.setItem(LS_PROGRAM, notes)
    return { notes, updated_at: new Date().toISOString() }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save locally"
    throw new Error(message)
  }
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage
  } catch (error) {
    console.warn("Local storage unavailable", error)
    return null
  }
}
