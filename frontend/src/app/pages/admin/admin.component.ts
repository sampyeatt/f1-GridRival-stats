import {ChangeDetectorRef, Component, inject} from '@angular/core'
// import {MessageService} from 'primeng/api'
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
import {MessageService} from 'primeng/api'
import {Message} from 'primeng/message'
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs'


@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [TableModule, ToastModule, CommonModule, TagModule, SelectModule, ButtonModule, InputTextModule, FormsModule, IconFieldModule, Message, Tabs, Tab, TabList, TabPanel, TabPanels],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {

  driverResults?: Result[]
  teamResults?: TeamResult[]
  resultSubmitSuccess: boolean = false
  resultSubmitError: boolean = false

  clonedResult: { [s: number]: Result } = {}

  public resultsService = inject(ResultsService)
  public router = inject(Router)
  private cdref = inject(ChangeDetectorRef)


  onFindResults() {
    this.resultSubmitSuccess = false
    this.resultSubmitError = false
    this.getDriverResults()
    this.getTeamResults()
  }

  getDriverResults() {
    this.resultsService.getNewDriverResults().subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        this.driverResults = data
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })
  }

  getTeamResults() {
    this.resultsService.getNewTeamResults().subscribe({
      next: (data) => {
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

  onRowEditInit(results: Result) {
    this.clonedResult[results.id] = {...results}
  }

  onRowEditSave(results: Result) {
    if (results.cost > 0) {
      delete this.clonedResult[results.id]
    } else {    }
  }

  onRowEditCancel(results: Result, index: number) {
    this.driverResults![index] = this.clonedResult[results.id]
    delete this.clonedResult[results.id]
  }

}
