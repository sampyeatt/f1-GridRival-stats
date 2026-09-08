// Re-downloads the Jolpica fixtures used by the test suite.
//   node test/refresh-fixtures.mjs
// Paced to stay well inside Jolpica's 4 req/s burst limit.
import {writeFile} from 'node:fs/promises'
import {join, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const DIR = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')
const UA = 'F1GridRivalStats/0.3.0 (fixtures)'
const SEASON = 2024

const weekends = [[1, 'bahrain-normal'], [5, 'china-sprint'], [21, 'brazil-chaos']]
const jobs = [
    [`${SEASON}`, 'season-schedule'],
    [`${SEASON}/drivers`, 'drivers'],
    [`${SEASON}/constructors`, 'constructors'],
    ...weekends.flatMap(([round, name]) =>
        ['results', 'qualifying', 'sprint'].map(s => [`${SEASON}/${round}/${s}`, `${name}.${s}`])
    )
]

for (const [path, name] of jobs) {
    const res = await fetch(`https://api.jolpi.ca/ergast/f1/${path}.json?limit=100`, {
        headers: {'User-Agent': UA}
    })
    if (!res.ok) throw new Error(`${path} → ${res.status}`)
    const body = await res.text()
    await writeFile(join(DIR, `${name}.json`), body)
    console.log(`${name}.json  ${body.length} bytes`)
    await new Promise(r => setTimeout(r, 300))
}
