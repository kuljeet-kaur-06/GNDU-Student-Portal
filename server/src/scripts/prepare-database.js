import { mkdir, open } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const value = process.env.DATABASE_URL
if (!value?.startsWith('file:')) throw new Error('DATABASE_URL must be a local SQLite file URL for this development setup.')

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const relativePath = value.slice('file:'.length).replace(/^\.\//, '')
if (!relativePath || path.isAbsolute(relativePath) || relativePath.includes('..')) throw new Error('DATABASE_URL must point to a SQLite file inside prisma/.')

const databasePath = path.join(projectRoot, 'prisma', relativePath)
await mkdir(path.dirname(databasePath), { recursive: true })
const handle = await open(databasePath, 'a')
await handle.close()
