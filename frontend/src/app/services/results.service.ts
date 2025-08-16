import {HttpClient} from '@angular/common/http'
import {Injectable, inject, computed} from '@angular/core'
import {environment} from '../../environments/environment.development'
import {Result} from '../interface/api-interface'
import {Observable} from 'rxjs'
import {toSignal} from '@angular/core/rxjs-interop'

@Injectable({
  providedIn: 'root'
})
export class ResultsService {
  apiUrl = computed(() => `${environment.API_URL}/api/result`)

  private http = inject(HttpClient)

  // private results$: Observable<Result[]> = this.getResults()
  //
  // public result = toSignal(this.results$, {initialValue: []})

  getResults(): Observable<Result[]> {
    return this.http.get<Result[]>(`${this.apiUrl()}/2025`)
  }

  getNewResults(): Observable<Result[]> {
    return this.http.get<Result[]>(`${this.apiUrl()}/2025`)
  }

  saveUpdatedResults(Results: Result[]) {
    return this.http.post(`${this.apiUrl()}/2025`, {})
  }
}
