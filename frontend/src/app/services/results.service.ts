import {HttpClient} from '@angular/common/http'
import {Injectable} from '@angular/core'
import {environment} from '../../environments/environment.development'

export interface Result {
  driverId: string
  raceId: string
  points: number
  cost: number
  seasonId: number
  round: number
  finishPosition: number
  teamId: string
}

@Injectable({
  providedIn: 'root'
})
export class ResultsService {
  apiUrl = `${environment.apiUrl}/api/result`

  constructor(private http: HttpClient) {}

  getResults() {
    return this.http.get<Result[]>(this.apiUrl)
  }
}
