import {HttpClient} from '@angular/common/http'
import {Injectable, inject} from '@angular/core'
import {environment} from '../../environments/environment'
import {Result} from '../interface/api-interface'
import {Observable} from 'rxjs'

@Injectable({providedIn: 'root'})
export class ResultsService {
  private apiUrl = `${environment.API_URL}/api/result`

  private http = inject(HttpClient)

  getResults(): Observable<Result[]> {
    return this.http.get<Result[]>(`${this.apiUrl}/allResults`)
  }

  getResultsByRound(round: number): Observable<Result[]> {
    return this.http.get<Result[]>(`${this.apiUrl}/round/${round}`)
  }

  /**
   * Pulls a round from the upstream and scores it. Idempotent — re-running
   * after a stewards' decision is the supported path.
   */
  ingestRound(round: number) {
    return this.http.post(`${this.apiUrl}/ingest`, {round})
  }

  /** Re-scores an already-ingested round without touching the upstream. */
  rescoreRound(round: number) {
    return this.http.post(`${this.apiUrl}/rescore/${round}`, {})
  }
}
