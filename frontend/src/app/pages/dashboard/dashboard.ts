import {Component, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA, OnChanges} from '@angular/core'
import {TableModule} from 'primeng/table'
import {CommonModule} from '@angular/common'
import {ButtonModule} from 'primeng/button'
import {FormsModule} from '@angular/forms'
import {ResultsService} from '../../services/results.service'
import {Race, Result} from '../../interface/api-interface'
import {BadgeModule} from 'primeng/badge'
import {TabsModule} from 'primeng/tabs'
import {Select} from 'primeng/select'
import {SeasonService} from '../../services/season.service'
import {filter} from 'rxjs'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    TableModule, CommonModule, ButtonModule, BadgeModule, FormsModule, TabsModule, Select
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})

export class DashboardComponent {
  results!: Result[]
  selectedResult!: Result[]
  races!: Race[]
  selectedRace!: Race


  public resultsService = inject(ResultsService)
  public seasonService = inject(SeasonService)

  ngOnInit() {
    this.seasonService.getSeasonList().subscribe({
      next: (data) => {
        this.races = data
        this.selectedRace = this.races[0]
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })

    this.resultsService.getResults().subscribe({
      next: (data) => {
        this.results = data
        this.selectedResult = this.results.filter(result => result.meeting_key === this.selectedRace.meeting_key)
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })
  }

  resultSeverity(result: Result){
    if (result.easeToGainPoints > 1) return 'danger'
    else if (result.easeToGainPoints <= 1 && result.easeToGainPoints >= -1) return 'warn'
    else return 'success'
  }

  filterResults(race: Race) {
    this.selectedResult = this.results.filter(result => result.meeting_key === this.selectedRace.meeting_key)
  }


  protected readonly filter = filter
}
