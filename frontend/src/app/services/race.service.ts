import {HttpClient} from '@angular/common/http'
import {Injectable, inject} from '@angular/core'
import {environment} from '../../environments/environment'
import {Race, RaceList} from '../interface/api-interface'
import {Observable} from 'rxjs'

@Injectable({providedIn: 'root'})
export class RaceService {
  private apiUrl = `${environment.API_URL}/api/race`

  private http = inject(HttpClient)

  getRaceList(): Observable<RaceList[]> {
    return this.http.get<RaceList[]>(`${this.apiUrl}/list`)
  }

  getAllRaces(): Observable<Race[]> {
    return this.http.get<Race[]>(`${this.apiUrl}/all`)
  }

  getRace(round: number): Observable<Race> {
    return this.http.get<Race>(`${this.apiUrl}/round/${round}`)
  }

  /** Pulls the calendar from Jolpica and upserts it. Safe to re-run. */
  syncSchedule() {
    return this.http.post(`${this.apiUrl}/sync`, {})
  }

  updateRace(race: Partial<Race> & {round: number}) {
    return this.http.put(`${this.apiUrl}/update`, {data: race})
  }

  deleteRace(round: number) {
    return this.http.delete(`${this.apiUrl}/delete/${round}`)
  }
}
