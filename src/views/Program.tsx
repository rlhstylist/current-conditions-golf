import { useEffect, useState } from "react"
import { getProgram, setProgram } from "@/lib/program"

export default function Program() {
  const [notes, setNotes] = useState("")
  const [updated, setUpdated] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const doc = await getProgram()
        if (!active || !doc) return
        setNotes(doc.notes ?? "")
        setUpdated(doc.updated_at ?? null)
      } catch (error) {
        console.error("Program load failed", error)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const onSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      const doc = await setProgram(notes)
      if (doc) {
        setUpdated(doc.updated_at)
        alert("Saved!")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      alert(`Save failed: ${message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6">Loading…</div>
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Program Notes</h1>
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Write your long-form program notes here…"
        className="min-h-[200px] w-full rounded-lg border border-black/20 p-3"
      />
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-black px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {updated ? (
          <p className="text-xs opacity-70">Last updated: {new Date(updated).toLocaleString()}</p>
        ) : null}
      </div>
    </div>
  )
}
