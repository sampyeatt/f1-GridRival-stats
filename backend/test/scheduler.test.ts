import {beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('../src/services/ingest.service', () => ({
    ingestRound: vi.fn(),
    ingestSchedule: vi.fn(),
    ingestDriversAndTeams: vi.fn()
}))
vi.mock('../src/services/results.service', () => ({
    rescoreFrom: vi.fn(async () => []),
    scoreRound: vi.fn(async () => ({round: 1, scored: 20, breakdown: []}))
}))
vi.mock('../src/services/teamresults.service', () => ({
    scoreTeamRound: vi.fn(async () => ({round: 1, scored: 10}))
}))
vi.mock('../src/services/season.services', () => ({
    getActiveSeason: vi.fn()
}))
vi.mock('../src/models/Race', () => ({Race: {findAll: vi.fn()}}))
vi.mock('../src/models/Results', () => ({Results: {findAll: vi.fn(), update: vi.fn()}}))
vi.mock('../src/models/TeamResults', () => ({TeamResults: {update: vi.fn()}}))
vi.mock('../src/models/IngestRun', () => ({IngestRun: {create: vi.fn()}}))

import {refreshSeason, runCheck, tick} from '../src/services/scheduler.service'
import {ingestDriversAndTeams, ingestRound, ingestSchedule} from '../src/services/ingest.service'
import {rescoreFrom, scoreRound} from '../src/services/results.service'
import {scoreTeamRound} from '../src/services/teamresults.service'
import {getActiveSeason} from '../src/services/season.services'
import {Race} from '../src/models/Race'
import {Results} from '../src/models/Results'
import {IngestRun} from '../src/models/IngestRun'
import {RACE_DURATION_MS} from '../src/services/checkpoints'

const HOUR = 3_600_000
const RACE_START = new Date('2026-03-08T15:00:00Z')
const at = (ms: number) => new Date(RACE_START.getTime() + ms)

/** Minimal Sequelize-instance stand-in. */
const row = (fields: Record<string, unknown>) => ({get: (k: string) => fields[k]})

function givenSeason(seasonId = 2026) {
    vi.mocked(getActiveSeason).mockResolvedValue(row({seasonId}) as any)
}

function givenRaces(races: Array<{round: number; startsAt: Date | null}>) {
    vi.mocked(Race.findAll).mockResolvedValue(races.map(r => row(r)) as any)
}

function givenResults(rows: Array<{round: number; ingestedAt: Date; provisional: boolean}>) {
    vi.mocked(Results.findAll).mockResolvedValue(rows.map(r => row(r)) as any)
}

beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(IngestRun.create).mockResolvedValue({} as any)
    vi.mocked(Results.update).mockResolvedValue([0] as any)
})

describe('a quiet week costs nothing', () => {

    it('makes no upstream call when no round is due', async () => {
        givenSeason()
        givenRaces([
            {round: 1, startsAt: new Date('2026-02-01T15:00:00Z')},
            {round: 2, startsAt: new Date('2026-04-01T15:00:00Z')}
        ])
        givenResults([
            {round: 1, ingestedAt: new Date('2026-02-02T20:00:00Z'), provisional: false}
        ])

        const summary = await tick(new Date('2026-03-01T12:00:00Z'))

        expect(summary.due).toBe(0)
        // The whole point of the checkpoint design: between events the tick is
        // one query and nothing else.
        expect(ingestRound).not.toHaveBeenCalled()
        expect(IngestRun.create).not.toHaveBeenCalled()
    })

    it('does nothing at all when there is no active season', async () => {
        vi.mocked(getActiveSeason).mockResolvedValue(null as any)
        const summary = await tick(new Date())
        expect(summary).toMatchObject({seasonId: null, due: 0})
        expect(ingestRound).not.toHaveBeenCalled()
    })
})

describe('a finished race is picked up', () => {

    it('ingests the round once its first checkpoint passes', async () => {
        givenSeason()
        givenRaces([{round: 3, startsAt: RACE_START}])
        givenResults([])
        vi.mocked(ingestRound).mockResolvedValue({round: 3, entries: 20, changed: true})

        const summary = await tick(at(RACE_DURATION_MS + HOUR))

        expect(summary.due).toBe(1)
        expect(ingestRound).toHaveBeenCalledWith(2026, 3)
        expect(summary.outcomes[0]).toMatchObject({round: 3, trigger: 'initial', outcome: 'ingested'})
    })
})

describe('runCheck', () => {

    it('re-scores forward when the classification changed', async () => {
        vi.mocked(ingestRound).mockResolvedValue({round: 5, entries: 20, changed: true})
        vi.mocked(Results.findAll).mockResolvedValue([row({round: 5}), row({round: 6})] as any)

        const outcome = await runCheck(2026, {round: 5, trigger: 'recheck-2h', canFinalise: false})

        expect(outcome).toBe('ingested')
        // Not just this round: the rolling average feeds the next seven and the
        // salary ladder chains forward.
        expect(rescoreFrom).toHaveBeenCalledWith(2026, 5)
    })

    it('does not re-score when nothing moved', async () => {
        vi.mocked(ingestRound).mockResolvedValue({round: 5, entries: 20, changed: false})

        const outcome = await runCheck(2026, {round: 5, trigger: 'recheck-2h', canFinalise: false})

        expect(outcome).toBe('unchanged')
        expect(rescoreFrom).not.toHaveBeenCalled()
        expect(Results.update).not.toHaveBeenCalled()
    })

    it('finalises an unchanged round once the last checkpoint has passed', async () => {
        vi.mocked(ingestRound).mockResolvedValue({round: 5, entries: 20, changed: false})

        const outcome = await runCheck(2026, {round: 5, trigger: 'final-24h', canFinalise: true})

        expect(outcome).toBe('unchanged')
        expect(Results.update).toHaveBeenCalledWith(
            {provisional: false},
            {where: {seasonId: 2026, round: 5}}
        )
    })

    it('does not finalise a round that just changed', async () => {
        vi.mocked(ingestRound).mockResolvedValue({round: 5, entries: 20, changed: true})
        vi.mocked(Results.findAll).mockResolvedValue([row({round: 5})] as any)

        await runCheck(2026, {round: 5, trigger: 'final-24h', canFinalise: true})

        // A result that moved at the 24h mark is not settled; the rolling
        // re-checks keep watching it.
        expect(Results.update).not.toHaveBeenCalledWith(
            {provisional: false},
            expect.anything()
        )
    })

    it('records a skip without touching the scoring', async () => {
        vi.mocked(ingestRound).mockResolvedValue({
            round: 9, entries: 0, changed: false, skipped: 'not raced yet'
        })

        const outcome = await runCheck(2026, {round: 9, trigger: 'initial', canFinalise: false})

        expect(outcome).toBe('skipped')
        expect(rescoreFrom).not.toHaveBeenCalled()
        expect(IngestRun.create).toHaveBeenCalledWith(
            expect.objectContaining({outcome: 'skipped', detail: 'not raced yet'})
        )
    })

    it('swallows an upstream failure and logs it rather than killing the tick', async () => {
        vi.mocked(ingestRound).mockRejectedValue(new Error('jolpica timeout'))

        const outcome = await runCheck(2026, {round: 5, trigger: 'initial', canFinalise: false})

        expect(outcome).toBe('failed')
        expect(IngestRun.create).toHaveBeenCalledWith(
            expect.objectContaining({outcome: 'failed', detail: 'jolpica timeout'})
        )
    })

    it('keeps going through a failure on one round', async () => {
        givenSeason()
        givenRaces([
            {round: 1, startsAt: RACE_START},
            {round: 2, startsAt: at(HOUR)}
        ])
        givenResults([])
        vi.mocked(ingestRound)
            .mockRejectedValueOnce(new Error('boom'))
            .mockResolvedValueOnce({round: 2, entries: 20, changed: true})

        const summary = await tick(at(RACE_DURATION_MS + 2 * HOUR))

        expect(summary.due).toBe(2)
        expect(summary.outcomes.map(o => o.outcome)).toEqual(['failed', 'ingested'])
    })
})

describe('rebuilding a whole season', () => {

    function givenAFullSync(rounds: Array<{round: number; startsAt: Date | null}>) {
        vi.mocked(ingestSchedule).mockResolvedValue(rounds.length)
        vi.mocked(ingestDriversAndTeams).mockResolvedValue({drivers: 20, teams: 10})
        givenRaces(rounds)
    }

    it('pulls the calendar and the line-up before any round', async () => {
        givenAFullSync([{round: 1, startsAt: RACE_START}])
        vi.mocked(ingestRound).mockResolvedValue({round: 1, entries: 20, changed: true})

        await refreshSeason(2026)

        // ingestRound drops entries for drivers and teams it does not yet know
        // about, so the line-up has to land first or round 1 comes back empty.
        const lineUp = vi.mocked(ingestDriversAndTeams).mock.invocationCallOrder[0]!
        const round = vi.mocked(ingestRound).mock.invocationCallOrder[0]!
        expect(vi.mocked(ingestSchedule).mock.invocationCallOrder[0]!).toBeLessThan(lineUp)
        expect(lineUp).toBeLessThan(round)
    })

    it('scores every ingested round, in ascending order', async () => {
        givenAFullSync([
            {round: 1, startsAt: RACE_START},
            {round: 2, startsAt: at(HOUR)},
            {round: 3, startsAt: at(2 * HOUR)}
        ])
        vi.mocked(ingestRound)
            .mockResolvedValueOnce({round: 1, entries: 20, changed: true})
            .mockResolvedValueOnce({round: 2, entries: 20, changed: true})
            .mockResolvedValueOnce({round: 3, entries: 0, changed: false, skipped: 'not raced yet'})

        const summary = await refreshSeason(2026)

        expect(summary).toMatchObject({seasonId: 2026, races: 3, drivers: 20, teams: 10})
        expect(summary.rounds.map(r => r.outcome)).toEqual(['ingested', 'ingested', 'skipped'])
        // The rolling average and the salary ladder both read the round before,
        // so scoring out of order silently produces wrong costs.
        expect(vi.mocked(scoreRound).mock.calls.map(c => c[1])).toEqual([1, 2])
        expect(vi.mocked(scoreTeamRound).mock.calls.map(c => c[1])).toEqual([1, 2])
    })

    it('does not score a round it could not ingest', async () => {
        givenAFullSync([
            {round: 1, startsAt: RACE_START},
            {round: 2, startsAt: at(HOUR)}
        ])
        vi.mocked(ingestRound)
            .mockRejectedValueOnce(new Error('jolpica timeout'))
            .mockResolvedValueOnce({round: 2, entries: 20, changed: true})

        const summary = await refreshSeason(2026)

        // One unreachable round must not abandon the other twenty-three.
        expect(summary.rounds.map(r => r.outcome)).toEqual(['failed', 'ingested'])
        expect(vi.mocked(scoreRound).mock.calls.map(c => c[1])).toEqual([2])
        expect(IngestRun.create).toHaveBeenCalledWith(
            expect.objectContaining({kind: 'season', outcome: 'failed'})
        )
    })

    it('records one season row summarising the pass', async () => {
        givenAFullSync([{round: 1, startsAt: RACE_START}])
        vi.mocked(ingestRound).mockResolvedValue({round: 1, entries: 20, changed: true})

        await refreshSeason(2026)

        expect(IngestRun.create).toHaveBeenCalledWith(expect.objectContaining({
            kind: 'season',
            trigger: 'manual',
            outcome: 'ingested',
            detail: '1/1 rounds scored, 20 drivers, 10 teams'
        }))
    })
})
