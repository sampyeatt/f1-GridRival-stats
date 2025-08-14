import {Component, inject, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core'
import {TableModule} from 'primeng/table'
import {CommonModule} from '@angular/common'
import {ButtonModule} from 'primeng/button'
import {FormsModule} from '@angular/forms'
import {ResultsService} from '../../services/results.service'
import {Race, Result, TeamResult} from '../../interface/api-interface'
import {BadgeModule} from 'primeng/badge'
import {TabsModule} from 'primeng/tabs'
import {Select} from 'primeng/select'
import {SeasonService} from '../../services/season.service'
import {filter} from 'rxjs'
import {TeamResultsService} from '../../services/teamresults.service'

@Component({
  selector: 'app-dashboard',
  imports: [
    TableModule, CommonModule, ButtonModule, BadgeModule, FormsModule, TabsModule, Select
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})

export class DashboardComponent {
  results?: Result[]
  selectedResult?: Result[]
  races?: Race[]
  selectedRace?: Race
  teamResults?: TeamResult[]
  selectedTeamResult?: TeamResult[]


  public resultsService = inject(ResultsService)
  public teamResultsService = inject(TeamResultsService)
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
        if(this.selectedRace){
          this.selectedResult = this.results.filter(result => result.meeting_key === this.selectedRace!.meeting_key)
        }
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })

    this.teamResultsService.getTeamResults().subscribe({
      next: (data) => {
        this.teamResults = data
        if(this.selectedRace){
          this.selectedTeamResult = this.teamResults.filter(result => result.meeting_key === this.selectedRace!.meeting_key)

        }
      },
      error: (err) => {}
    })
  }

  resultSeverity(result: Result){
    if (result.easeToGainPoints > 2) return 'danger'
    else if (result.easeToGainPoints <= 2 && result.easeToGainPoints > 0) return 'warn'
    else return 'success'
  }

  filterResults() {
    if(this.selectedRace){
      this.selectedResult = this.results!.filter(result => result.meeting_key === this.selectedRace!.meeting_key)
      this.selectedTeamResult = this.teamResults!.filter(result => result.meeting_key === this.selectedRace!.meeting_key)
    } else {
      this.selectedResult = undefined
      this.selectedTeamResult = undefined
    }

  }


  protected readonly filter = filter
}
