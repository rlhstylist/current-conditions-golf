import type { Course } from "../lib/overpass"
import { findNearestCourse, searchCoursesByName } from "../lib/overpass"

const KEY = "ccg_course_v1"

export type CourseState = { course?: Course, manual?: boolean }

export function loadCourse(): CourseState {
  const s = localStorage.getItem(KEY)
  return s ? JSON.parse(s) : {}
}
export function saveCourse(cs: CourseState){ localStorage.setItem(KEY, JSON.stringify(cs)) }

export async function pickNearest(lat:number, lon:number){
  const hit = await findNearestCourse(lat,lon)
  if (hit) saveCourse({ course: hit, manual:false })
  return hit
}

export async function searchByName(name:string, lat?:number, lon?:number){
  return searchCoursesByName(name, lat, lon)
}
