import {HttpClient} from '@angular/common/http'
import {Injectable, inject, computed} from '@angular/core'
import {environment} from '../../environments/environment.development'
import {Result, TeamResult} from '../interface/api-interface'
import {Observable} from 'rxjs'
import {toSignal} from '@angular/core/rxjs-interop'

@Injectable({
  providedIn: 'root'
})
export class ResultsService {
  apiUrl = computed(() => `${environment.API_URL}/api/result`)

  private http = inject(HttpClient)

  getResults(): Observable<Result[]> {
    return this.http.get<Result[]>(`${this.apiUrl()}/2025`)
  }

  getNewDriverResults(): Observable<Result[]> {
    return this.http.get<Result[]>(`${this.apiUrl()}/drivers`)
  }

  // TODO move to teamResultsService
  getNewTeamResults(): Observable<TeamResult[]> {
    return this.http.get<TeamResult[]>(`${this.apiUrl()}/teams`)
  }

  saveUpdatedResults(results: Result[]) {
    return this.http.post(`${this.apiUrl()}/add`, {results})
  }
}
