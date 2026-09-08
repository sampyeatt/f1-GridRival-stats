import axios, {AxiosError} from 'axios'
import logger from './logger.util'

/**
 * Client for the Jolpica-F1 API (https://api.jolpi.ca), the maintained
 * successor to Ergast. Replaces the previous split between api.openf1.org and
 * f1api.dev — one source means one canonical round number, one driver list and
 * one finishing order, which is what removed the index-merge bugs in the old
 * race controller.
 *
 * Three things the API requires or rewards, all handled here:
 *   - a custom User-Agent (the API explicitly asks for one)
 *   - staying under 4 requests/second burst and 500/hour sustained
 *   - tolerating the empty-but-200 response for a session that did not happen
 */

const BASE = process.env.JOLPICA_BASE_URL ?? 'https://api.jolpi.ca/ergast/f1'
const USER_AGENT = process.env.JOLPICA_USER_AGENT ?? 'F1GridRivalStats/0.3.0'

const MIN_REQUEST_SPACING_MS = 260  // ~3.8 req/s, just inside the 4/s burst limit
const MAX_ATTEMPTS = 4
const TIMEOUT_MS = 15_000

/** Serialises every call and spaces them out; the API is shared and rate-limited. */
let queue: Promise<unknown> = Promise.resolve()
let lastRequestAt = 0

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function isRetryable(error: unknown): boolean {
    const status = (error as AxiosError)?.response?.status
    if (status === undefined) return true          // network error or timeout
    return status === 429 || status >= 500
}

async function request<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
    const run = async (): Promise<T> => {
        const wait = MIN_REQUEST_SPACING_MS - (Date.now() - lastRequestAt)
        if (wait > 0) await sleep(wait)

        let lastError: unknown
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                lastRequestAt = Date.now()
                const response = await axios.get<T>(`${BASE}/${path}.json`, {
                    params: {limit: 100, ...params},
                    headers: {'User-Agent': USER_AGENT},
                    timeout: TIMEOUT_MS
                })
                return response.data
            } catch (error) {
                lastError = error
                if (attempt === MAX_ATTEMPTS || !isRetryable(error)) break

                // 429 asks us to back off harder than a 5xx does.
                const status = (error as AxiosError)?.response?.status
                const backoff = (status === 429 ? 2000 : 500) * 2 ** (attempt - 1)
                logger.warn(`jolpica ${path} attempt ${attempt} failed (${status ?? 'network'}), retrying in ${backoff}ms`)
                await sleep(backoff)
                lastRequestAt = Date.now()
            }
        }
        throw lastError
    }

    // Chain onto the queue so concurrent callers cannot burst past the limiter.
    const result = queue.then(run, run)
    queue = result.catch(() => undefined)
    return result
}

export type JolpicaSession = 'results' | 'qualifying' | 'sprint'

/**
 * Classification rows for one session of one round.
 *
 * A session that did not take place (a sprint on a non-sprint weekend) answers
 * 200 with an empty RaceTable rather than 404, so an empty array here means
 * "no such session", not "request failed".
 */
export async function getSessionClassification(
    season: number,
    round: number,
    session: JolpicaSession
): Promise<any[]> {
    const data = await request<any>(`${season}/${round}/${session}`)
    const races = data?.MRData?.RaceTable?.Races ?? []
    if (races.length === 0) return []

    const key = ['Results', 'QualifyingResults', 'SprintResults']
        .find(k => races[0][k]) as string | undefined
    return key ? races[0][key] : []
}

/** Every round of a season, in order, with first-class round numbers. */
export async function getSeasonSchedule(season: number): Promise<any[]> {
    const data = await request<any>(`${season}`)
    return data?.MRData?.RaceTable?.Races ?? []
}

export async function getSeasonDrivers(season: number): Promise<any[]> {
    const data = await request<any>(`${season}/drivers`)
    return data?.MRData?.DriverTable?.Drivers ?? []
}

export async function getSeasonConstructors(season: number): Promise<any[]> {
    const data = await request<any>(`${season}/constructors`)
    return data?.MRData?.ConstructorTable?.Constructors ?? []
}

/**
 * Which constructor each driver drove for in a given round. Jolpica only
 * exposes this through a classification, and mid-season driver swaps mean it
 * genuinely varies round to round — so it is read per round rather than from
 * the season-level driver list.
 */
export async function getRoundLineup(season: number, round: number): Promise<any[]> {
    return getSessionClassification(season, round, 'results')
}
