import {readFileSync} from 'fs'
import {join} from 'path'

const DIR = join(__dirname, '..', 'fixtures')

/**
 * Real Jolpica-F1 payloads captured from api.jolpi.ca for the 2024 season.
 * Refresh with `npm run fixtures:refresh`.
 *
 *   bahrain-normal  round 1  · 20 classified finishers, no sprint session
 *   china-sprint    round 5  · sprint weekend, 3 retirements
 *   brazil-chaos    round 21 · sprint weekend, 2 retired / 2 withdrawn / 1 disqualified
 */
export type Weekend = 'bahrain-normal' | 'china-sprint' | 'brazil-chaos'
export type Session = 'results' | 'qualifying' | 'sprint'

function read(name: string): any {
    return JSON.parse(readFileSync(join(DIR, `${name}.json`), 'utf8'))
}

/** Raw MRData envelope, as the API returns it. */
export function envelope(weekend: Weekend, session: Session): any {
    return read(`${weekend}.${session}`)
}

/**
 * The classification rows for one session, or [] when the session did not
 * happen (Bahrain has no sprint — the API returns an empty RaceTable rather
 * than a 404, which the adapter has to tolerate).
 */
export function classification(weekend: Weekend, session: Session): any[] {
    const races = envelope(weekend, session).MRData?.RaceTable?.Races ?? []
    if (races.length === 0) return []
    const key = ['Results', 'QualifyingResults', 'SprintResults'].find(k => races[0][k])
    return key ? races[0][key] : []
}

/** The 24-round 2024 schedule. */
export function schedule(): any[] {
    return read('season-schedule').MRData.RaceTable.Races
}

export function drivers(): any[] {
    return read('drivers').MRData.DriverTable.Drivers
}

export function constructors(): any[] {
    return read('constructors').MRData.ConstructorTable.Constructors
}
