const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export function isSupabaseReady(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

export type RpcResult<T> = {
  data: T | null
  error: Error | null
}

export async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<RpcResult<T>> {
  if (!isSupabaseReady()) {
    return { data: null, error: new Error("Supabase is not configured") }
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY as string,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(args ?? {}),
    })

    if (!res.ok) {
      const detail = await res.text()
      const message = detail || `RPC ${fn} failed with status ${res.status}`
      return { data: null, error: new Error(message) }
    }

    if (res.status === 204) {
      return { data: null, error: null }
    }

    const json = (await res.json()) as T | null
    return { data: json, error: null }
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Supabase request failed")
    return { data: null, error: err }
  }
}
