import {describe, expect, it} from 'vitest'
import {
    adaptConstructors,
    adaptDrivers,
    adaptSchedule,
    adaptWeekend,
    qualiStatusFrom,
    raceDistance,
    raceStatusFrom
} from '../src/shared/jolpica.adapter'
import {classification, constructors, drivers, schedule} from './helpers/fixtures'

const weekend = (name: Parameters<typeof classification>[0]) => adaptWeekend(
    classification(name, 'results'),
    classification(name, 'qualifying'),
    classification(name, 'sprint')
)

describe('status mapping', () => {
    it('reads outcome from positionText, never from position', () => {
        expect(raceStatusFrom(undefined)).toBe('classified')
        expect(raceStatusFrom('1')).toBe('classified')
        expect(raceStatusFrom('R')).toBe('dnf')
        expect(raceStatusFrom('N')).toBe('dnf')
        expect(raceStatusFrom('D')).toBe('dsq')
        expect(raceStatusFrom('E')).toBe('dsq')
        expect(raceStatusFrom('W')).toBe('dns')
        expect(raceStatusFrom('F')).toBe('dns')
    })

    it('collapses qualifying to classified/dns/dsq', () => {
        // You cannot retire from qualifying — not setting a time is a DNS.
        expect(qualiStatusFrom('R')).toBe('dns')
        expect(qualiStatusFrom('W')).toBe('dns')
        expect(qualiStatusFrom('D')).toBe('dsq')
        expect(qualiStatusFrom('3')).toBe('classified')
    })
})

describe('schedule', () => {
    it('maps 24 rounds and flags sprint weekends', () => {
        const races = adaptSchedule(2024, schedule())
        expect(races).toHaveLength(24)
        expect(races[0]).toMatchObject({seasonId: 2024, round: 1, hasSprint: false})

        // 2024 ran six sprints: China, Miami, Austria, COTA, Brazil, Qatar.
        const sprintRounds = races.filter(r => r.hasSprint).map(r => r.round)
        expect(sprintRounds).toHaveLength(6)
        expect(sprintRounds).toContain(5)   // China
        expect(sprintRounds).toContain(21)  // Brazil
    })

    it('carries circuit and location through', () => {
        const bahrain = adaptSchedule(2024, schedule())[0]!
        expect(bahrain.circuitId).toBe('bahrain')
        expect(bahrain.country).toBe('Bahrain')
        expect(bahrain.raceName).toContain('Bahrain')
    })
})

describe('race distance', () => {
    it('is the winner lap count, not a driver average', () => {
        expect(raceDistance(classification('bahrain-normal', 'results'))).toBe(57)
        expect(raceDistance(classification('china-sprint', 'results'))).toBe(56)
    })

    it('is 0 for a session that never ran', () => {
        expect(raceDistance(classification('bahrain-normal', 'sprint'))).toBe(0)
    })
})

describe('adaptWeekend — clean race', () => {
    const entries = weekend('bahrain-normal')

    it('produces one entry per entrant, all classified', () => {
        expect(entries).toHaveLength(20)
        expect(entries.every(e => e.raceStatus === 'classified')).toBe(true)
        expect(entries.every(e => e.qualiStatus === 'classified')).toBe(true)
    })

    it('has no sprint position on a non-sprint weekend', () => {
        expect(entries.every(e => e.sprintPosition === null)).toBe(true)
    })

    it('gives every entry a resolvable team', () => {
        const known = new Set(adaptConstructors(constructors()).map(t => t.teamId))
        for (const e of entries) expect(known).toContain(e.teamId)
    })

    it('assigns a full 1..20 race order', () => {
        expect(entries.map(e => e.racePosition).sort((a, b) => a - b))
            .toEqual(Array.from({length: 20}, (_, i) => i + 1))
    })
})

describe('adaptWeekend — sprint weekend', () => {
    const entries = weekend('china-sprint')

    it('carries a sprint position for every driver', () => {
        expect(entries).toHaveLength(20)
        expect(entries.every(e => e.sprintPosition !== null)).toBe(true)
    })

    it('marks the three retirements as dnf while keeping their position', () => {
        const dnfs = entries.filter(e => e.raceStatus === 'dnf')
        expect(dnfs).toHaveLength(3)
        // This is the trap: position is still a number on a retirement.
        for (const e of dnfs) expect(e.racePosition).toBeGreaterThan(0)
    })
})

describe('adaptWeekend — chaotic race', () => {
    const entries = weekend('brazil-chaos')

    it('separates retired, withdrawn and disqualified', () => {
        expect(entries.filter(e => e.raceStatus === 'dnf')).toHaveLength(2)
        expect(entries.filter(e => e.raceStatus === 'dns')).toHaveLength(2)
        expect(entries.filter(e => e.raceStatus === 'dsq')).toHaveLength(1)
        expect(entries.filter(e => e.raceStatus === 'classified')).toHaveLength(15)
    })

    it('still resolves a qualifying position for every entrant', () => {
        // Brazil 2024 qualifying was heavily disrupted; nobody should come out
        // of the adapter without a usable grid slot.
        for (const e of entries) {
            expect(e.qualiPosition).toBeGreaterThan(0)
        }
    })

    it('does not throw on a driver absent from qualifying', () => {
        // Synthesised: take the real race rows but an empty qualifying payload.
        const raceRows = classification('brazil-chaos', 'results')
        const adapted = adaptWeekend(raceRows, [], [])

        expect(adapted).toHaveLength(20)
        expect(adapted.every(e => e.qualiStatus === 'dns')).toBe(true)
        // Classified behind the (empty) field rather than at position 0, which
        // would have scored as a pole.
        expect(adapted.every(e => e.qualiPosition === 1)).toBe(true)
    })
})

describe('drivers and constructors', () => {
    it('keys drivers by slug and builds a display name', () => {
        const all = adaptDrivers(drivers())
        const max = all.find(d => d.driverId === 'max_verstappen')
        expect(max).toMatchObject({driverId: 'max_verstappen', driverName: 'Max Verstappen', shortName: 'VER'})
    })

    it('KNOWN UPSTREAM QUIRK: permanentNumber is not unique or even correct', () => {
        // Jolpica reports permanentNumber 3 for both ricciardo and
        // max_verstappen (whose real permanent number is 33). The old schema
        // had `unique: true` on driverNumber, so importing this season's
        // drivers would have failed outright on the constraint.
        //
        // The new schema keys drivers by the slug and joins every
        // classification by slug, so driverNumber is display metadata only and
        // carries no unique constraint. This test exists to record that the
        // field cannot be trusted, not to assert the upstream stays broken.
        const all = adaptDrivers(drivers())
        const byNumber = new Map<number, string[]>()
        for (const d of all) {
            byNumber.set(d.driverNumber, [...(byNumber.get(d.driverNumber) ?? []), d.driverId])
        }
        const collisions = [...byNumber.values()].filter(ids => ids.length > 1)
        expect(collisions.length).toBeGreaterThan(0)

        // The slug, by contrast, is unique — which is why it is the key.
        expect(new Set(all.map(d => d.driverId)).size).toBe(all.length)
    })

    it('tolerates a driver with no permanent number', () => {
        const [adapted] = adaptDrivers([{driverId: 'x', givenName: 'A', familyName: 'B', code: 'ABC'}])
        expect(adapted!.driverNumber).toBe(0)
    })

    it('maps constructors to id and name', () => {
        const teams = adaptConstructors(constructors())
        expect(teams).toHaveLength(10)
        expect(teams.find(t => t.teamId === 'mclaren')?.teamName).toBe('McLaren')
    })
})
