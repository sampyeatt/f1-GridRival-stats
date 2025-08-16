import {HttpClient} from '@angular/common/http'
import {Injectable, inject, computed} from '@angular/core'
import {environment} from '../../environments/environment.development'
import {TeamResult} from '../interface/api-interface'
import {Observable} from 'rxjs'
import {toSignal} from '@angular/core/rxjs-interop'

@Injectable({
  providedIn: 'root'
})
export class TeamResultsService {
  apiUrl = computed(() => `${environment.API_URL}/api/teamresult`)

  private http = inject(HttpClient)

  // private results$: Observable<Result[]> = this.getResults()
  //
  // public result = toSignal(this.results$, {initialValue: []})

  getTeamResults(): Observable<TeamResult[]> {
    return this.http.get<TeamResult[]>(`${this.apiUrl()}`)
  }

  getNewTeamResults(): Observable<TeamResult[]> {
    return this.http.get<TeamResult[]>(`${this.apiUrl()}/teams`)
  }
}
