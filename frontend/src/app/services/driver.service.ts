import {HttpClient} from '@angular/common/http'
import {Injectable, inject} from '@angular/core'
import {environment} from '../../environments/environment'
import {Driver} from '../interface/api-interface'
import {Observable} from 'rxjs'

@Injectable({providedIn: 'root'})
export class DriverService {
  private apiUrl = `${environment.API_URL}/api/drivers`

  private http = inject(HttpClient)

  getDrivers(): Observable<Driver[]> {
    return this.http.get<Driver[]>(`${this.apiUrl}/all`)
  }

  /** Syncs drivers and constructors for the active season. */
  syncDrivers() {
    return this.http.post(`${this.apiUrl}/sync`, {})
  }

  updateDriver(driver: Partial<Driver> & {driverId: string}) {
    return this.http.put(`${this.apiUrl}/update`, {data: driver})
  }
}
