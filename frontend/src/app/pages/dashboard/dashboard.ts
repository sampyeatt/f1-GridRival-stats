import {
  Component,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  ChangeDetectorRef
} from '@angular/core'
import {TableModule} from 'primeng/table'
import {CommonModule} from '@angular/common'
import {ButtonModule} from 'primeng/button'
import {FormsModule} from '@angular/forms'
import {ResultsService} from '../../services/results.service'
import {Race, Result, TeamResult} from '../../interface/api-interface'
import {BadgeModule} from 'primeng/badge'
import {TabsModule} from 'primeng/tabs'
import {Select} from 'primeng/select'
import {filter} from 'rxjs'
import {TeamResultsService} from '../../services/teamresults.service'
import {RaceService} from '../../services/race.service'

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

export class DashboardComponent implements OnInit {
  results?: Result[]
  selectedResult?: Result[]
  races?: Race[]
  selectedRace?: Race
  teamResults?: TeamResult[]
  selectedTeamResult?: TeamResult[]


  public resultsService = inject(ResultsService)
  public teamResultsService = inject(TeamResultsService)
  private raceService = inject(RaceService)
  private cdref = inject(ChangeDetectorRef)

  // @ViewChild('dynamicComponent ', {read: ViewContainerRef})

  ngOnInit() {
    this.loadRaces()
    this.loadDriverResults()
    this.loadTeamResults()
    this.cdref.markForCheck()
  }

  loadRaces() {
    this.raceService.getRaceList().subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        this.races = data
        this.selectedRace = this.races[data.length-1]
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })
  }

  loadDriverResults() {
    this.resultsService.getResults().subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        this.results = data
        if (this.selectedRace) {
          this.selectedResult = this.results.filter(result => result.meeting_key === this.selectedRace!.meeting_key)
        }
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })
  }

  loadTeamResults() {
    this.teamResultsService.getTeamResults().subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        this.teamResults = data
        if (this.selectedRace) {
          this.selectedTeamResult = this.teamResults.filter(result => result.meeting_key === this.selectedRace!.meeting_key)
        }
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })
  }

  resultSeverity(result: Result) {
    if (result.easeToGainPoints > 2) return 'danger'
    else if (result.easeToGainPoints <= 2 && result.easeToGainPoints > 0) return 'warn'
    else return 'success'
  }

  filterResults() {
    if (this.selectedRace) {
      this.selectedResult = this.results!.filter(result => result.meeting_key === this.selectedRace!.meeting_key)
      this.selectedTeamResult = this.teamResults!.filter(result => result.meeting_key === this.selectedRace!.meeting_key)
    } else {
      this.selectedResult = undefined
      this.selectedTeamResult = undefined
    }

  }


  protected readonly filter = filter
}
