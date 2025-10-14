import { ReactNode } from "react"

export default function Modal({ open, onClose, children }:{
  open:boolean; onClose:()=>void; children: ReactNode
}){
  if (!open) return null
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.6)",
      display:"grid", placeItems:"center", padding:"20px", zIndex:1000
    }} onClick={onClose}>
      <div className="card" style={{width:"min(500px, 92vw)"}} onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
