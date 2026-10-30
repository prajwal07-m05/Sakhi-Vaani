import fs from 'node:fs'
import path from 'node:path'
import type { Database } from '../../../shared-types'
import { buildSeed } from '../../../database/seed/seed'
import { hashPassword } from '../config/security'

/**
 * JSON-file persistence adapter (works with no external credentials).
 * Replace with a Firestore adapter by implementing the same load/save contract.
 */
export function createFileStore(file: string) {
  let db: Database
  const load = (): Database => {
    if (fs.existsSync(file)) {
      db = JSON.parse(fs.readFileSync(file, 'utf8'))
    } else {
      db = buildSeed(new Date(), hashPassword)
      save()
      console.log(`[sakhi-vani] Seeded synthetic demo data → ${file}`)
    }
    return db
  }
  let timer: NodeJS.Timeout | undefined
  const save = () => {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    const tmp = `${file}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2))
    fs.renameSync(tmp, file)
  }
  const scheduleSave = () => {
    clearTimeout(timer)
    timer = setTimeout(save, 50)
  }
  const reset = () => {
    db = buildSeed(new Date(), hashPassword)
    save()
    return db
  }
  return { load, save, scheduleSave, reset, get: () => db }
}
