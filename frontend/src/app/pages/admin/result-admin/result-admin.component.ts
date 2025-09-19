import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core'
import {TableModule} from 'primeng/table'
import {ToastModule} from 'primeng/toast'
import {CommonModule} from '@angular/common'
import {TagModule} from 'primeng/tag'
import {SelectModule} from 'primeng/select'
import {ButtonModule} from 'primeng/button'
import {InputTextModule} from 'primeng/inputtext'
import {RaceList, Result, TeamResult} from '../../../interface/api-interface'
import {ResultsService} from '../../../services/results.service'
import {FormsModule} from '@angular/forms'
import {Router} from '@angular/router'
import {IconFieldModule} from 'primeng/iconfield'
import {MessageModule} from 'primeng/message'
import {TabsModule} from 'primeng/tabs'
import {TeamResultsService} from '../../../services/teamresults.service'
import {TooltipModule} from 'primeng/tooltip'
import {RaceService} from '../../../services/race.service'


@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [TableModule,
    ToastModule,
    CommonModule,
    TagModule,
    SelectModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    IconFieldModule,
    MessageModule,
    TabsModule,
    TooltipModule],
  templateUrl: './result-admin.component.html',
  styleUrl: './result-admin.component.css'
})
export class ResultAdminComponent implements OnInit{

  driverResults?: Result[]
  teamResults?: TeamResult[]
  resultSubmitSuccess: boolean = false
  resultSubmitError: boolean = false

  races?: RaceList[]
  selectedRace?: RaceList
  clonedDriverResult: { [s: number]: Result } = {}
  clonedTeamResults: { [s: number]: TeamResult } = {}

  private resultsService = inject(ResultsService)
  private teamResultsService = inject(TeamResultsService)
  private raceService = inject(RaceService)
  public router = inject(Router)
  private cdref = inject(ChangeDetectorRef)

  ngOnInit() {
    this.loadRaces()
  }

  // TODO add name of race being reviewed to html
  onFindResults() {
    this.resultSubmitSuccess = false
    this.resultSubmitError = false
    this.getDriverResults()
    this.getTeamResults()
  }

  loadRaces() {
    this.raceService.getRaceList().subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        this.races = data
        this.selectedRace = this.races[data.length - 1]
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })
  }

  getDriverResults() {
    if (this.selectedRace) {
      this.resultsService.getNewDriverResults(this.selectedRace).subscribe({
        next: (data) => {
          this.cdref.markForCheck()
          this.driverResults = data
        },
        error: (err) => {
          console.error('Error Loading posts: ', err)
        }
      })
    }

  }

  getTeamResults() {
    if (this.selectedRace) {
      this.teamResultsService.getNewTeamResults(this.selectedRace).subscribe({
        next: (data) => {
          this.cdref.markForCheck()
          this.teamResults = data
        },
        error: (err) => {
          console.error('Error Loading posts: ', err)
        }
      })
    }

  }

  onSaveResults() {
    this.saveDriverResults(this.driverResults!)
    this.saveTeamResults(this.teamResults!)
  }

  saveDriverResults(driverResults: Result[]) {
    this.resultsService.saveUpdatedDriverResults(driverResults!).subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        this.driverResults = undefined
        this.resultSubmitSuccess = true
        this.resultSubmitError = false
      },
      error: (err) => {
        this.resultSubmitError = true
        console.error('Error Loading posts: ', err)
      }
    })
  }

  saveTeamResults(teamResults: TeamResult[]) {
    this.teamResultsService.saveUpdatedTeamResults(teamResults!).subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        this.driverResults = undefined
        this.resultSubmitSuccess = true
        this.resultSubmitError = false
      },
      error: (err) => {
        this.resultSubmitError = true
        console.error('Error Loading posts: ', err)
      }
    })
  }


  onRowEditInitDriver(results: Result) {
    this.clonedDriverResult[results.id] = {...results}
  }

  onRowEditSaveDriver(results: Result) {
    if (results.cost > 0) {
      delete this.clonedDriverResult[results.id]
    } else {
    }
  }

  onRowEditCancelDriver(results: Result, index: number) {
    this.driverResults![index] = this.clonedDriverResult[results.id]
    delete this.clonedDriverResult[results.id]
  }

  onRowEditInitTeam(results: Result) {
    this.clonedTeamResults[results.id] = {...results}
  }

  onRowEditSaveTeam(results: Result) {
    if (results.cost > 0) {
      delete this.clonedTeamResults[results.id]
    } else {
    }
  }

  onRowEditCancelTeam(results: Result, index: number) {
    this.teamResults![index] = this.clonedTeamResults[results.id]
    delete this.clonedTeamResults[results.id]
  }

}
