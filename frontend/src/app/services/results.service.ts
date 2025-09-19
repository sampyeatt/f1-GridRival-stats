import {HttpClient} from '@angular/common/http'
import {Injectable, inject, computed} from '@angular/core'
import {environment} from '../../environments/environment'
import {RaceList, Result} from '../interface/api-interface'
import {Observable} from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class ResultsService {
  apiUrl = computed(() => `${environment.API_URL}/api/result`)

  private http = inject(HttpClient)

  getResults(): Observable<Result[]> {
    return this.http.get<Result[]>(`${this.apiUrl()}/allResults`)
  }

  getNewDriverResults(selectedRace: RaceList): Observable<Result[]> {
    return this.http.get<Result[]>(`${this.apiUrl()}/drivers/${selectedRace.meeting_key}`)
  }

  saveUpdatedDriverResults(results: Result[]) {
    return this.http.post(`${this.apiUrl()}/add`, {results})
  }
}
