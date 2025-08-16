import {ChangeDetectorRef, Component, inject} from '@angular/core'
import {TableModule} from 'primeng/table'
import {ToastModule} from 'primeng/toast'
import {CommonModule} from '@angular/common'
import {TagModule} from 'primeng/tag'
import {SelectModule} from 'primeng/select'
import {ButtonModule} from 'primeng/button'
import {InputTextModule} from 'primeng/inputtext'
import {Result, TeamResult} from '../../interface/api-interface'
import {ResultsService} from '../../services/results.service'
import {FormsModule} from '@angular/forms'
import {Router} from '@angular/router'
import {IconFieldModule} from 'primeng/iconfield'
import {Message} from 'primeng/message'
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs'
import {Ripple} from 'primeng/ripple'
import {TeamResultsService} from '../../services/teamresults.service'


@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [TableModule, ToastModule, CommonModule, TagModule, SelectModule, ButtonModule, InputTextModule, FormsModule, IconFieldModule, Message, Tabs, Tab, TabList, TabPanel, TabPanels, Ripple],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {

  driverResults?: Result[]
  teamResults?: TeamResult[]
  resultSubmitSuccess: boolean = false
  resultSubmitError: boolean = false

  clonedDriverResult: { [s: number]: Result } = {}
  clonedTeamResults: { [s: number]: TeamResult } = {}

  private resultsService = inject(ResultsService)
  private teamResultsService = inject(TeamResultsService)
  public router = inject(Router)
  private cdref = inject(ChangeDetectorRef)


  // TODO add name of race being reviewed to html
  onFindResults() {
    this.resultSubmitSuccess = false
    this.resultSubmitError = false
    this.getDriverResults()
    this.getTeamResults()
  }

  getDriverResults() {
    this.resultsService.getNewDriverResults().subscribe({
      next: (data) => {
        console.log('Driver Results: ', data)
        this.cdref.markForCheck()
        this.driverResults = data
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })
  }

  getTeamResults() {
    this.teamResultsService.getNewTeamResults().subscribe({
      next: (data) => {
        console.log('Team Results: ', data)
        this.cdref.markForCheck()
        this.teamResults = data
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })
  }

  onSaveResults() {
    this.resultsService.saveUpdatedResults(this.driverResults!).subscribe({
      next: (data) => {
        console.log(data)
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
    } else {    }
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
    } else {    }
  }

  onRowEditCancelTeam(results: Result, index: number) {
    this.teamResults![index] = this.clonedTeamResults[results.id]
    delete this.clonedTeamResults[results.id]
  }

}
