import { ref } from 'vue'
import { db, type CourseTemplate } from '../db'

const templates = ref<CourseTemplate[]>([])

async function load(): Promise<void> {
  const all = await db.courseTemplates.toArray()
  templates.value = all.sort((a, b) => a.name.localeCompare(b.name) || a.tee.localeCompare(b.tee))
}

async function add(t: Omit<CourseTemplate, 'id'>): Promise<number> {
  const id = await db.courseTemplates.add(t)
  await load()
  return id
}

async function update(id: number, t: Omit<CourseTemplate, 'id'>): Promise<void> {
  await db.courseTemplates.put({ ...t, id })
  await load()
}

async function remove(id: number): Promise<void> {
  await db.courseTemplates.delete(id)
  await load()
}

export function useCourseTemplates() {
  return { templates, load, add, update, remove }
}
