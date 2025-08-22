import {HttpClient} from '@angular/common/http'
import {Injectable, inject, computed} from '@angular/core'
import {environment} from '../../environments/environment.development'
import {Driver} from '../interface/api-interface'
import {Observable} from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  apiUrl = computed(() => `${environment.API_URL}/api/drivers`)

  private http = inject(HttpClient)

  getDrivers(): Observable<Driver[]> {
    return this.http.get<Driver[]>(`${this.apiUrl()}/all`)
  }

  addDriversNewSeason() {
    return this.http.post(`${this.apiUrl()}/newSeason`, {})
  }

  updateDriver(team: Driver) {
    return this.http.put(`${this.apiUrl()}/update`, {data: team})
  }

  deleteDriver(teamId: string) {
    return this.http.delete(`${this.apiUrl()}/delete/${teamId}`)
  }
}
