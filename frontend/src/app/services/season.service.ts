import {HttpClient} from '@angular/common/http'
import {Injectable, inject, computed} from '@angular/core'
import {environment} from '../../environments/environment'
import {Season} from '../interface/api-interface'
import {Observable} from 'rxjs'

@Injectable({
  providedIn: 'root'
})

export class SeasonService {
  apiUrl = computed(() => `${environment.API_URL}/api/season`)

  private http = inject(HttpClient)

  getAllSeasons(): Observable<Season[]> {
    return this.http.get<Season[]>(`${this.apiUrl()}/all`)
  }

  getActiveSeason(): Observable<Season> {
    return this.http.get<Season>(`${this.apiUrl()}/active`)
  }

  inactivateSeason(seasonId: number) {
    return this.http.put(`${this.apiUrl()}/inactivate`, {seasonId: seasonId})
  }

  deleteSeason(seasonId: number) {
    return this.http.delete(`${this.apiUrl()}/delete/${seasonId}`)
  }

  addSeason(seasonId: number) {
    return this.http.post(`${this.apiUrl()}/add`, {seasonId: seasonId})
  }
}
