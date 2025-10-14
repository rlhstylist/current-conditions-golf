import { useEffect, useRef } from "react"

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function Modal({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    const first = ref.current?.querySelector<HTMLElement>("[data-autofocus]")
    first?.focus()
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="modalOverlay"
      onClick={onClose}
    >
      <div
        className="modal panel"
        onClick={(e) => e.stopPropagation()}
        ref={ref}
      >
        {title ? <div className="modalTitle">{title}</div> : null}
        <div className="modalBody">{children}</div>
      </div>
    </div>
  )
}
