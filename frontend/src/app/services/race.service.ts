import {HttpClient} from '@angular/common/http'
import {Injectable, inject, computed} from '@angular/core'
import {environment} from '../../environments/environment.development'
import {Race} from '../interface/api-interface'
import {Observable} from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class RaceService {
  apiUrl = computed(() => `${environment.API_URL}/api/race`)

  private http = inject(HttpClient)

  getRaceList(): Observable<Race[]> {
    return this.http.get<Race[]>(`${this.apiUrl()}`)
  }
  getAll(): Observable<Race[]> {
    return this.http.get<Race[]>(`${this.apiUrl()}`)
  }

  getActive(): Observable<Race[]> {
    return this.http.get<Race[]>(`${this.apiUrl()}`)
  }
}
