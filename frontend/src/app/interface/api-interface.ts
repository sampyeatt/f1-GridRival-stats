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

export interface Race {
  meeting_name: string
  meeting_key: number
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
