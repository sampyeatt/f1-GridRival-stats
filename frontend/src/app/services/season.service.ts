import {HttpClient} from '@angular/common/http'
import {Injectable, inject, computed} from '@angular/core'
import {environment} from '../../environments/environment'
import {Race} from '../interface/api-interface'
import {Observable} from 'rxjs'
import {toSignal} from '@angular/core/rxjs-interop'

@Injectable({
  providedIn: 'root'
})

export class SeasonService {
  apiUrl = computed(() => `${environment.API_URL}/api/race`)

  private http = inject(HttpClient)

  // private season$: Observable<Race[]> = this.getSeasonList()
  //
  // public season = toSignal(this.season$, {initialValue: []})

  getSeasonList(): Observable<Race[]> {
    return this.http.get<Race[]>(`${this.apiUrl()}`)
  }
}
