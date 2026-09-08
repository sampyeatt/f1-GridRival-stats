import {ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, PLATFORM_ID} from '@angular/core'
import {TableModule, TableRowCollapseEvent, TableRowExpandEvent} from 'primeng/table'
import {CommonModule, isPlatformBrowser} from '@angular/common'
import {ButtonModule} from 'primeng/button'
import {FormsModule} from '@angular/forms'
import {BadgeModule} from 'primeng/badge'
import {TabsModule} from 'primeng/tabs'
import {SelectModule} from 'primeng/select'
import {Ripple} from 'primeng/ripple'
import {ChartModule} from 'primeng/chart'
import {forkJoin} from 'rxjs'
import {RaceList, Result, TeamResult} from '../../interface/api-interface'
import {ResultsService} from '../../services/results.service'
import {TeamResultsService} from '../../services/teamresults.service'
import {RaceService} from '../../services/race.service'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    TableModule, CommonModule, ButtonModule, BadgeModule, FormsModule,
    TabsModule, SelectModule, Ripple, ChartModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {

  results?: Result[]
  teamResults?: TeamResult[]
  races?: RaceList[]

  selectedRace?: RaceList
  selectedResult?: Result[]
  selectedTeamResult?: TeamResult[]

  // Each table keeps its own expansion and chart state. They previously shared
  // one `expandedRows` object and one `data`, so expanding a driver and then
  // switching to the Teams tab showed the driver's chart under a team row.
  expandedDriverRows: Record<string, boolean> = {}
  expandedTeamRows: Record<string, boolean> = {}
  driverChart?: {data: unknown; options: unknown}
  teamChart?: {data: unknown; options: unknown}

  loading = true
  errorMessage?: string

  severityColors = new Map<number, string>([
    [-5, '#00ccff'], [-4, '#99ebff'], [-3, '#2eb82e'], [-2, '#70db70'],
    [-1, '#adebad'], [0, '#eef6ee'], [1, '#ffc6b3'], [2, '#ff794d'],
    [3, '#ff4000'], [4, '#b32d00'], [5, '#802000']
  ])

  private resultsService = inject(ResultsService)
  private teamResultsService = inject(TeamResultsService)
  private raceService = inject(RaceService)
  private cdref = inject(ChangeDetectorRef)
  private platformId = inject(PLATFORM_ID)

  /**
   * All three loads are joined rather than fired independently.
   *
   * They used to race: the two results handlers only populated their tables
   * `if (this.selectedRace)`, which the race list set — so whenever results
   * arrived first, both tables came up empty until the user picked a round by
   * hand.
   */
  ngOnInit() {
    forkJoin({
      races: this.raceService.getRaceList(),
      results: this.resultsService.getResults(),
      teamResults: this.teamResultsService.getTeamResults()
    }).subscribe({
      next: ({races, results, teamResults}) => {
        this.races = races
        this.results = results
        this.teamResults = teamResults
        this.selectedRace = this.latestScoredRound(races, results)
        this.filterResults()
        this.loading = false
        this.cdref.markForCheck()
      },
      error: (err) => {
        this.loading = false
        this.errorMessage = 'Could not load results. Try again shortly.'
        console.error('Dashboard load failed', err)
        this.cdref.markForCheck()
      }
    })
  }

  /**
   * The most recent round that actually has results, rather than the last row
   * of the calendar — which for most of a season is a race that has not
   * happened yet and therefore shows an empty table.
   */
  private latestScoredRound(races: RaceList[], results: Result[]): RaceList | undefined {
    const scored = new Set(results.map(r => r.round))
    const withResults = races.filter(r => scored.has(r.round))
    return withResults[withResults.length - 1] ?? races[races.length - 1]
  }

  filterResults() {
    if (!this.selectedRace) {
      this.selectedResult = undefined
      this.selectedTeamResult = undefined
      return
    }
    const round = this.selectedRace.round
    this.selectedResult = this.results?.filter(r => r.round === round)
    this.selectedTeamResult = this.teamResults?.filter(r => r.round === round)

    // A chart built for a different round would be stale.
    this.driverChart = undefined
    this.teamChart = undefined
    this.expandedDriverRows = {}
    this.expandedTeamRows = {}
  }

  posSev(row: {easeToGainPoints: number}) {
    return this.severityColors.get(row.easeToGainPoints)
  }

  onRowExpandDriver(event: TableRowExpandEvent) {
    const driver = event.data as Result
    this.driverChart = this.buildChart(
      (this.results ?? []).filter(r => r.driverId === driver.driverId),
      'Points scored'
    )
    this.cdref.markForCheck()
  }

  onRowCollapseDriver(_event: TableRowCollapseEvent) {
    this.driverChart = undefined
  }

  onRowExpandTeam(event: TableRowExpandEvent) {
    const team = event.data as TeamResult
    // Team results, not driver rows. This previously filtered `this.results`
    // by teamId, so the constructor chart plotted its two drivers' individual
    // scores interleaved instead of the team's.
    this.teamChart = this.buildChart(
      (this.teamResults ?? []).filter(r => r.teamId === team.teamId),
      'Points scored'
    )
    this.cdref.markForCheck()
  }

  onRowCollapseTeam(_event: TableRowCollapseEvent) {
    this.teamChart = undefined
  }

  /**
   * Builds a line chart from whatever rounds the series actually covers.
   *
   * Labels and data are derived from the same rows. Previously the labels came
   * from the full season calendar while the series only covered scored rounds;
   * Chart.js pairs them by index, so a single missing round mislabelled every
   * point after it.
   */
  private buildChart(
    rows: Array<{round: number; points: number}>,
    label: string
  ): {data: unknown; options: unknown} | undefined {
    if (!isPlatformBrowser(this.platformId) || rows.length === 0) return undefined

    const style = getComputedStyle(document.documentElement)
    const textColor = style.getPropertyValue('--p-text-color')
    const mutedColor = style.getPropertyValue('--p-text-muted-color')
    const borderColor = style.getPropertyValue('--p-content-border-color')

    const ordered = [...rows].sort((a, b) => a.round - b.round)
    const nameByRound = new Map(this.races?.map(r => [r.round, r.raceName]) ?? [])

    return {
      data: {
        labels: ordered.map(r => nameByRound.get(r.round) ?? `Round ${r.round}`),
        datasets: [{
          label,
          data: ordered.map(r => r.points),
          fill: false,
          borderColor: style.getPropertyValue('--p-cyan-500'),
          tension: 0.4
        }]
      },
      options: {
        maintainAspectRatio: false,
        aspectRatio: 0.6,
        plugins: {legend: {labels: {color: textColor}}},
        scales: {
          x: {ticks: {color: mutedColor}, grid: {color: borderColor, drawBorder: false}},
          y: {ticks: {color: mutedColor}, grid: {color: borderColor, drawBorder: false}}
        }
      }
    }
  }
}
