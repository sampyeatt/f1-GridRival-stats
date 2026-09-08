import {HttpClient} from '@angular/common/http'
import {Injectable, inject} from '@angular/core'
import {environment} from '../../environments/environment'
import {TeamResult} from '../interface/api-interface'
import {Observable} from 'rxjs'

@Injectable({providedIn: 'root'})
export class TeamResultsService {
  private apiUrl = `${environment.API_URL}/api/teamresult`

  private http = inject(HttpClient)

  getTeamResults(): Observable<TeamResult[]> {
    return this.http.get<TeamResult[]>(`${this.apiUrl}/teamresults`)
  }

  getTeamResultsByRound(round: number): Observable<TeamResult[]> {
    return this.http.get<TeamResult[]>(`${this.apiUrl}/byRound/${round}`)
  }
}
