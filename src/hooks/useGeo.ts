type GeoStatus = "idle"|"prompt"|"granted"|"denied"
export type Geo = { status: GeoStatus; coords?: {lat:number, lon:number} }

const KEY = "ccg_geo_cache_v1"

export function useGeo(): [Geo, ()=>void]{
  // lazy state to avoid SSR mismatch
  const s = (window.localStorage.getItem(KEY))
  const init: Geo = s ? JSON.parse(s) : { status:"idle" }
  let geo = init

  function save(){
    localStorage.setItem(KEY, JSON.stringify(geo))
  }

  async function request(){
    if (!("geolocation" in navigator)){
      geo = { status:"denied" }
      save(); return
    }
    geo = { status:"prompt" }; save()
    await new Promise<void>((resolve)=>{
      navigator.geolocation.getCurrentPosition(
        p => {
          geo = { status:"granted", coords:{ lat:p.coords.latitude, lon:p.coords.longitude } }
          save(); resolve()
        },
        _err => { geo = { status:"denied" }; save(); resolve() },
        { enableHighAccuracy:false, timeout:8000, maximumAge:60_000 }
      )
    })
  }

  return [geo, request]
}
