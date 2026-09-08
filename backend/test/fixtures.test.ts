import {describe, expect, it} from 'vitest'
import {classification, constructors, drivers, schedule} from './helpers/fixtures'

/**
 * Guards the shape the Phase 2 Jolpica adapter is going to depend on. If a
 * refreshed fixture breaks one of these, the adapter would have broken too.
 */
describe('Jolpica fixtures', () => {

    it('gives a full 24-round schedule with first-class round numbers', () => {
        const rounds = schedule()
        expect(rounds).toHaveLength(24)
        expect(rounds.map(r => Number(r.round))).toEqual(
            Array.from({length: 24}, (_, i) => i + 1)
        )
        expect(rounds[0]).toMatchObject({
            season: '2024',
            round: '1',
            raceName: expect.any(String),
            Circuit: {circuitId: expect.any(String)}
        })
    })

    it('returns an empty classification for a weekend with no sprint', () => {
        // Bahrain 2024 had no sprint. The API answers 200 with an empty
        // RaceTable rather than 404, so the adapter must not treat this
        // as an error.
        expect(classification('bahrain-normal', 'sprint')).toEqual([])
        expect(classification('china-sprint', 'sprint')).toHaveLength(20)
    })

    it('marks non-finishers in positionText while position stays numeric', () => {
        const rows = classification('brazil-chaos', 'results')
        const byText = (t: string) => rows.filter(r => r.positionText === t)

        expect(byText('R')).toHaveLength(2)   // retired
        expect(byText('W')).toHaveLength(2)   // withdrawn
        expect(byText('D')).toHaveLength(1)   // disqualified

        // The trap the current OpenF1 code falls into: `position` is still a
        // plausible-looking number on a retirement, so status has to be read
        // from positionText, never inferred from position.
        for (const row of byText('R')) {
            expect(Number(row.position)).toBeGreaterThan(0)
        }
    })

    it('has no positionText on qualifying rows', () => {
        // Qualifying classifications carry only `position` — the adapter
        // cannot share a status parser between race and qualifying.
        const quali = classification('brazil-chaos', 'qualifying')
        expect(quali).toHaveLength(20)
        expect(quali[0].positionText).toBeUndefined()
        expect(Number(quali[0].position)).toBe(1)
    })

    it('keys drivers by a stable slug, not by car number', () => {
        const all = drivers()
        // 25 drivers for a 20-car grid: mid-season replacements are in here,
        // which is why `active` has to be per-round and not a Driver column.
        expect(all.length).toBeGreaterThan(20)
        expect(all[0]).toMatchObject({
            driverId: expect.any(String),
            familyName: expect.any(String)
        })
        expect(new Set(all.map(d => d.driverId)).size).toBe(all.length)
    })

    it('gives every result row a constructorId that resolves', () => {
        const known = new Set(constructors().map(c => c.constructorId))
        const rows = classification('china-sprint', 'results')
        for (const row of rows) {
            expect(known).toContain(row.Constructor.constructorId)
        }
    })
})
