// src/db/get-hash.ts
import { readFileSync } from 'fs'
import { createHash } from 'crypto'

const sql = readFileSync('drizzle/0000_puzzling_absorbing_man.sql', 'utf8')
const hash = createHash('sha256').update(sql).digest('hex')
console.log(hash)
