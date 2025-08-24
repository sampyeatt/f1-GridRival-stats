import {HttpClient} from '@angular/common/http'
import {Injectable, inject, computed} from '@angular/core'
import {environment} from '../../environments/environment.development'
import {Race, RaceList} from '../interface/api-interface'
import {Observable} from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class RaceService {
  apiUrl = computed(() => `${environment.API_URL}/api/race`)

  private http = inject(HttpClient)

  getRaceList(): Observable<RaceList[]> {
    return this.http.get<RaceList[]>(`${this.apiUrl()}/list`)
  }

  getAllRaces(): Observable<Race[]> {
    return this.http.get<Race[]>(`${this.apiUrl()}/all`)
  }

  getRace(meeting_key: string): Observable<Race[]> {
    return this.http.get<Race[]>(`${this.apiUrl()}/bykey/${meeting_key}`)
  }

  bulkUpdateRace() {
    return this.http.put(`${this.apiUrl()}/bulkUpdate`, {})
  }

  updateRace(race: Race) {
    console.log(race)
    return this.http.put(`${this.apiUrl()}/update`, {data: race})
  }

  deleteRace(meeting_key: number) {
    return this.http.delete(`${this.apiUrl()}/delete/${meeting_key}`)
  }

  addRaceBulk() {
    return this.http.post(`${this.apiUrl()}/addRaceBulk`, {})
  }
}
