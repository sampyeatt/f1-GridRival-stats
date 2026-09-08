import {HttpClient} from '@angular/common/http'
import {Injectable, inject} from '@angular/core'
import {environment} from '../../environments/environment'
import {Team} from '../interface/api-interface'
import {Observable} from 'rxjs'

@Injectable({providedIn: 'root'})
export class TeamService {
  private apiUrl = `${environment.API_URL}/api/teams`

  private http = inject(HttpClient)

  getTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(this.apiUrl)
  }

  updateTeam(team: Team) {
    return this.http.put(`${this.apiUrl}/update`, {data: team})
  }

  deleteTeam(teamId: string) {
    return this.http.delete(`${this.apiUrl}/delete/${teamId}`)
  }
}
