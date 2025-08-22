export interface Result {
  id: number
  driverId: string
  raceId: string
  points: number
  cost: number
  rank: number
  seasonId: number
  round: number
  finishPosition: number
  qualiPosition: number
  positionDifference: number
  positionsForMoney: number
  easeToGainPoints: number
  teamId: string
  meeting_key: number
}

export interface TeamResult {
  id: number
  raceId: string
  points: number
  cost: number
  rank: number
  seasonId: number
  round: number
  positionDifference: number
  positionsForMoney: number
  easeToGainPoints: number
  teamId: string
  meeting_key: number
}

export interface RaceList {
  meeting_name: string
  meeting_key: number
}

export interface Race {
  meeting_key: number
  circut_key: number
  meeting_name: string
  circuit_short_name: string
  country_code: string
  country_name: string
  sprint_key: number | null
  quali_key: number
  race_key: number
  round: number
  totalLaps: number
  raceId: string
  seasonId: number
  createdAt: string
  updatedAt: string
}

export interface Session {
  accessToken: string
  refreshToken: string,
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
