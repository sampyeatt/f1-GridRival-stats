import {HttpClient} from '@angular/common/http'
import {Injectable, inject, computed} from '@angular/core'
import {environment} from '../../environments/environment.development'
import {Team} from '../interface/api-interface'
import {Observable} from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  apiUrl = computed(() => `${environment.API_URL}/api/teams`)

  private http = inject(HttpClient)

  getTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(`${this.apiUrl()}`)
  }

  addTeamsNewSeason() {
    return this.http.post(`${this.apiUrl()}/newSeason`, {})
  }

  updateTeam(team: Team) {
    return this.http.put(`${this.apiUrl()}/update`, {data: team})
  }

  deleteTeam(teamId: string) {
    return this.http.delete(`${this.apiUrl()}/delete/${teamId}`)
  }
}
