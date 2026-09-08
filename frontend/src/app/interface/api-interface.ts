/**
 * API contract shapes.
 *
 * Source of truth is the Zod schemas and Sequelize models in backend/src.
 * When the React migration lands, this file is what moves into a shared
 * package consumed by both apps — keep it a faithful mirror until then.
 */

export type RaceStatus = 'classified' | 'dnf' | 'dns' | 'dsq'
export type QualiStatus = 'classified' | 'dns' | 'dsq'

export interface Result {
  seasonId: number
  round: number
  driverId: string
  teamId: string
  points: number
  cost: number
  rank: number
  racePosition: number
  qualiPosition: number
  sprintPosition: number | null
  lapsCompleted: number
  raceStatus: RaceStatus
  qualiStatus: QualiStatus
  positionDifference: number
  positionsForMoney: number
  easeToGainPoints: number
  provisional: boolean
  driver?: Driver
}

export interface TeamResult {
  seasonId: number
  round: number
  teamId: string
  points: number
  cost: number
  rank: number
  positionDifference: number
  positionsForMoney: number
  easeToGainPoints: number
  provisional: boolean
  team?: Team
}

/** Trimmed race, used for the round picker. */
export interface RaceList {
  round: number
  raceName: string
  hasSprint: boolean
  date: string
}

export interface Race {
  seasonId: number
  round: number
  raceName: string
  circuitId: string
  circuitName: string
  country: string
  locality: string
  date: string
  hasSprint: boolean
  totalLaps: number
}

export interface Session {
  accessToken: string
  refreshToken: string
  adminToken: string | null
  user: {
    userId: number
    name: string
    email: string
  }
}

export interface Season {
  seasonId: number
  currentSeason: boolean
}

export interface Team {
  teamId: string
  teamName: string
}

export interface Driver {
  driverId: string
  driverName: string
  driverNumber: number
  shortName: string
  active: boolean
  teamId: string
  team?: Team
}

export type IngestOutcome = 'ingested' | 'unchanged' | 'skipped' | 'failed'

export interface IngestRun {
  id: number
  kind: string
  seasonId: number
  round: number | null
  trigger: string
  outcome: IngestOutcome
  detail: string | null
  classificationChanged: boolean
  durationMs: number
  startedAt: string
}

export interface SeasonRefreshSummary {
  seasonId: number
  races: number
  drivers: number
  teams: number
  rounds: Array<{round: number; outcome: IngestOutcome; detail: string}>
}

export interface SchedulerStatus {
  seasonId: number
  now: string
  due: Array<{round: number; trigger: string; canFinalise: boolean}>
  rounds: Array<{
    round: number
    startsAt: string | null
    lastIngestedAt: string | null
    provisional: boolean
  }>
}
