import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const agentRoot = join(__dirname, '..')

/** Load agent/.env.local or agent/.env into process.env (no overwrite). */
export function loadAgentEnv(): void {
  for (const name of ['.env.local', '.env']) {
    const path = join(agentRoot, name)
    if (!existsSync(path)) continue
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim()
      if (process.env[key] === undefined || process.env[key] === '') {
        process.env[key] = value
      }
    }
    break
  }
}

loadAgentEnv()
