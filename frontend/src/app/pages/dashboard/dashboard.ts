import {
  Component,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  ChangeDetectorRef, PLATFORM_ID
} from '@angular/core'
import {TableModule, TableRowCollapseEvent, TableRowExpandEvent} from 'primeng/table'
import {CommonModule, isPlatformBrowser} from '@angular/common'
import {ButtonModule} from 'primeng/button'
import {FormsModule} from '@angular/forms'
import {ResultsService} from '../../services/results.service'
import {RaceList, Result, TeamResult} from '../../interface/api-interface'
import {BadgeModule} from 'primeng/badge'
import {TabsModule} from 'primeng/tabs'
import {SelectModule} from 'primeng/select'
import {TeamResultsService} from '../../services/teamresults.service'
import {RaceService} from '../../services/race.service'
import {Ripple} from 'primeng/ripple'
import {ChartModule} from 'primeng/chart'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    TableModule, CommonModule, ButtonModule, BadgeModule, FormsModule, TabsModule, SelectModule, Ripple, ChartModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})

export class DashboardComponent implements OnInit {
  results?: Result[]
  selectedResult?: Result[]
  races?: RaceList[]
  selectedRace?: RaceList
  teamResults?: TeamResult[]
  selectedTeamResult?: TeamResult[]
  options: any
  data: any
  expandedRows = {}

  severityColors = new Map<number, string>([
    [-5, '#00ccff'],
    [-4, '#99ebff'],
    [-3, '#2eb82e'],
    [-2, '#70db70'],
    [-1, '#adebad'],
    [0, '#eef6ee'],
    [1, '#ffc6b3'],
    [2, '#ff794d'],
    [3, '#ff4000'],
    [4, '#b32d00'],
    [5, '#802000'],
  ])


  public resultsService = inject(ResultsService)
  public teamResultsService = inject(TeamResultsService)
  private raceService = inject(RaceService)
  private cdref = inject(ChangeDetectorRef)
  platformId = inject(PLATFORM_ID)

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
        this.selectedRace = this.races[data.length - 1]
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

  posSev(posSev: Result) {
    return this.severityColors.get(posSev.easeToGainPoints)
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

  onRowExpandDriver(event: TableRowExpandEvent) {
    console.log('Expanded: ', event.data)
    this.buildChartDriver(event.data)
  }

  onRowCollapseDriver(event: TableRowCollapseEvent) {
    console.log('Expandednt: ', event.data)
    this.data = undefined
  }

  onRowExpandTeam(event: TableRowExpandEvent) {
    this.buildChartTeam(event.data)
  }

  onRowCollapseTeam(event: TableRowCollapseEvent) {
    this.data = undefined
  }

  buildChartDriver(expandedDriver: Result) {
    if (isPlatformBrowser(this.platformId)) {
      const documentStyle = getComputedStyle(document.documentElement)
      const textColor = documentStyle.getPropertyValue('--p-text-color')
      const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color')
      const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color')

      const filteredResults = this.results?.filter(
        result => result.driverId === expandedDriver.driverId
      ).sort((a, b) => a.round - b.round)

      this.data = {
        labels: this.races!.map(race => race.meeting_name),
        datasets: [
          {
            label: 'Points Scored',
            data: filteredResults!.map(result => result.points),
            fill: false,
            borderColor: documentStyle.getPropertyValue('--p-cyan-500'),
            tension: 0.4
          }
        ]
      }

      this.options = {
        maintainAspectRatio: false,
        aspectRatio: 0.6,
        plugins: {
          legend: {
            labels: {
              color: textColor
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: textColorSecondary
            },
            grid: {
              color: surfaceBorder,
              drawBorder: false
            }
          },
          y: {
            ticks: {
              color: textColorSecondary
            },
            grid: {
              color: surfaceBorder,
              drawBorder: false
            }
          }
        }
      }
      this.cdref.markForCheck()
    }
  }

  buildChartTeam(expandedTeam: TeamResult) {
    if (isPlatformBrowser(this.platformId)) {
      const documentStyle = getComputedStyle(document.documentElement)
      const textColor = documentStyle.getPropertyValue('--p-text-color')
      const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color')
      const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color')

      const filteredResults = this.results?.filter(
        result => result.teamId === expandedTeam.teamId
      ).sort((a, b) => a.round - b.round)

      this.data = {
        labels: this.races!.map(race => race.meeting_name),
        datasets: [
          {
            label: 'Points Scored',
            data: filteredResults!.map(result => result.points),
            fill: false,
            borderColor: documentStyle.getPropertyValue('--p-cyan-500'),
            tension: 0.4
          }
        ]
      }

      this.options = {
        maintainAspectRatio: false,
        aspectRatio: 0.6,
        plugins: {
          legend: {
            labels: {
              color: textColor
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: textColorSecondary
            },
            grid: {
              color: surfaceBorder,
              drawBorder: false
            }
          },
          y: {
            ticks: {
              color: textColorSecondary
            },
            grid: {
              color: surfaceBorder,
              drawBorder: false
            }
          }
        }
      }
      this.cdref.markForCheck()
    }
  }
}
