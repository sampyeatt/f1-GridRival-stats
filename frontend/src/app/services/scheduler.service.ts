import {HttpClient} from '@angular/common/http'
import {Injectable, inject} from '@angular/core'
import {environment} from '../../environments/environment'
import {IngestRun, SchedulerStatus, SeasonRefreshSummary} from '../interface/api-interface'
import {Observable} from 'rxjs'

@Injectable({providedIn: 'root'})
export class SchedulerService {
  private apiUrl = `${environment.API_URL}/api/scheduler`

  private http = inject(HttpClient)

  /** What the scheduler would do right now, without doing it. */
  getStatus(): Observable<SchedulerStatus> {
    return this.http.get<SchedulerStatus>(`${this.apiUrl}/status`)
  }

  getRuns(limit = 50): Observable<IngestRun[]> {
    return this.http.get<IngestRun[]>(`${this.apiUrl}/runs?limit=${limit}`)
  }

  runTick() {
    return this.http.post(`${this.apiUrl}/tick`, {})
  }

  syncSeason() {
    return this.http.post(`${this.apiUrl}/sync`, {})
  }

  /**
   * Rebuilds the whole active season — calendar, line-up, results, scores.
   * Minutes rather than seconds: three upstream requests per round.
   */
  refreshSeason(): Observable<SeasonRefreshSummary> {
    return this.http.post<SeasonRefreshSummary>(`${this.apiUrl}/season`, {})
  }

  runRound(round: number) {
    return this.http.post(`${this.apiUrl}/round/${round}`, {})
  }
}
