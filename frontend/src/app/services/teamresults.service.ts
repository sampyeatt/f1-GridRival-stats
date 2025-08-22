import {HttpClient} from '@angular/common/http'
import {Injectable, inject, computed} from '@angular/core'
import {environment} from '../../environments/environment'
import {TeamResult} from '../interface/api-interface'
import {Observable} from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class TeamResultsService {
  apiUrl = computed(() => `${environment.API_URL}/api/teamresult`)

  private http = inject(HttpClient)

  getTeamResults(): Observable<TeamResult[]> {
    return this.http.get<TeamResult[]>(`${this.apiUrl()}/teamresults`)
  }

  getNewTeamResults(): Observable<TeamResult[]> {
    return this.http.get<TeamResult[]>(`${this.apiUrl()}/teams`)
  }

  saveUpdatedTeamResults(results: TeamResult[]) {
    return this.http.post(`${this.apiUrl()}/add`, {results})
  }
}
