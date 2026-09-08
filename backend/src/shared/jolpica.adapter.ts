/**
 * Maps raw Jolpica-F1 payloads onto the app's row shapes.
 *
 * Kept free of database and network access so it can be tested directly
 * against the captured fixtures in test/fixtures.
 */

export type RaceStatus = 'classified' | 'dnf' | 'dns' | 'dsq'
export type QualiStatus = 'classified' | 'dns' | 'dsq'

export interface AdaptedRace {
    seasonId: number
    round: number
    raceName: string
    circuitId: string
    circuitName: string
    country: string
    locality: string
    date: string
    /** Race start in UTC, from the schedule's date+time. */
    startsAt: Date | null
    hasSprint: boolean
    totalLaps: number
}

export interface AdaptedEntry {
    driverId: string
    teamId: string
    racePosition: number
    raceStatus: RaceStatus
    qualiPosition: number
    qualiStatus: QualiStatus
    sprintPosition: number | null
    lapsCompleted: number
}

/**
 * Ergast/Jolpica keep `position` numeric even for a car that never finished,
 * and carry the real outcome in `positionText`. Reading status from `position`
 * — which the previous OpenF1 code effectively did — silently scores a
 * retirement as a finish.
 *
 *   R  retired          D  disqualified     E  excluded
 *   W  withdrawn        F  failed to qualify N  not classified
 */
export function raceStatusFrom(positionText: string | undefined): RaceStatus {
    switch (positionText) {
        case 'R':
        case 'N':
            return 'dnf'
        case 'D':
        case 'E':
            return 'dsq'
        case 'W':
        case 'F':
            return 'dns'
        default:
            return 'classified'
    }
}

export function qualiStatusFrom(positionText: string | undefined): QualiStatus {
    const status = raceStatusFrom(positionText)
    // There is no such thing as retiring from qualifying; anything that is not
    // a disqualification means the driver did not set a time.
    return status === 'classified' ? 'classified' : status === 'dsq' ? 'dsq' : 'dns'
}

function toInt(value: unknown, fallback = 0): number {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
}

/**
 * The race distance actually run, taken as the winner's lap count.
 *
 * Ergast has no "scheduled laps" field — the previous code went to f1api.dev
 * for it. The leader's lap count is the correct denominator for completion
 * points anyway: it is the distance the race was run over, including a
 * red-flagged race that finished short.
 */
export function raceDistance(raceRows: any[]): number {
    return raceRows.reduce((max, row) => Math.max(max, toInt(row.laps)), 0)
}

/**
 * Combines the schedule's separate date and time fields into an instant.
 * Times come through as e.g. "15:00:00Z", already UTC.
 */
export function parseSessionStart(date: unknown, time: unknown): Date | null {
    if (!date) return null
    if (!time) return null
    const parsed = new Date(`${date}T${time}`)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function adaptSchedule(seasonId: number, scheduleRows: any[]): AdaptedRace[] {
    return scheduleRows.map(row => ({
        seasonId,
        round: toInt(row.round),
        raceName: String(row.raceName ?? ''),
        circuitId: String(row.Circuit?.circuitId ?? ''),
        circuitName: String(row.Circuit?.circuitName ?? ''),
        country: String(row.Circuit?.Location?.country ?? ''),
        locality: String(row.Circuit?.Location?.locality ?? ''),
        date: String(row.date ?? ''),
        startsAt: parseSessionStart(row.date, row.time),
        // The schedule marks a sprint weekend with a Sprint session block.
        hasSprint: Boolean(row.Sprint),
        totalLaps: 0   // filled in from the classification once the race is run
    }))
}

export function adaptDrivers(driverRows: any[]): Array<{
    driverId: string
    driverName: string
    driverNumber: number
    shortName: string
}> {
    return driverRows.map(row => ({
        driverId: String(row.driverId),
        driverName: `${row.givenName ?? ''} ${row.familyName ?? ''}`.trim(),
        // Not every driver has a permanent number (test and stand-in drivers);
        // 0 is a deliberate "unknown" rather than a real car number.
        driverNumber: toInt(row.permanentNumber, 0),
        shortName: String(row.code ?? row.driverId).toUpperCase()
    }))
}

export function adaptConstructors(rows: any[]): Array<{teamId: string; teamName: string}> {
    return rows.map(row => ({
        teamId: String(row.constructorId),
        teamName: String(row.name ?? row.constructorId)
    }))
}

/**
 * Joins one weekend's three classifications into a per-driver entry.
 *
 * Driven by the race classification: a driver who qualified but did not start
 * still appears in the race rows with positionText "W", so the race payload is
 * the authoritative list of entrants. Qualifying and sprint are looked up by
 * driverId, which is stable across seasons — unlike car number, which the old
 * OpenF1 join used.
 */
export function adaptWeekend(
    raceRows: any[],
    qualiRows: any[],
    sprintRows: any[]
): AdaptedEntry[] {
    const fallbackOrder = (rows: any[], driverId: string) =>
        rows.findIndex(r => r.Driver?.driverId === driverId) + 1

    const qualiByDriver = new Map<string, any>(
        qualiRows.map(row => [String(row.Driver?.driverId), row])
    )
    const sprintByDriver = new Map<string, any>(
        sprintRows.map(row => [String(row.Driver?.driverId), row])
    )

    return raceRows.map(row => {
        const driverId = String(row.Driver?.driverId)
        const raceStatus = raceStatusFrom(row.positionText)

        const quali = qualiByDriver.get(driverId)
        const sprint = sprintByDriver.get(driverId)

        // A driver missing from qualifying is a real case (pit-lane start, a
        // mid-weekend replacement, a session they sat out). The old code
        // dereferenced it unguarded and threw. Here it becomes an explicit
        // "did not set a time", classified last.
        const qualiStatus: QualiStatus = quali ? qualiStatusFrom(quali.positionText) : 'dns'
        const qualiPosition = quali
            ? toInt(quali.position, fallbackOrder(qualiRows, driverId))
            : qualiRows.length + 1

        return {
            driverId,
            teamId: String(row.Constructor?.constructorId ?? ''),
            racePosition: toInt(row.position, fallbackOrder(raceRows, driverId)),
            raceStatus,
            qualiPosition,
            qualiStatus,
            sprintPosition: sprint ? toInt(sprint.position, null as any) : null,
            lapsCompleted: toInt(row.laps)
        }
    })
}
