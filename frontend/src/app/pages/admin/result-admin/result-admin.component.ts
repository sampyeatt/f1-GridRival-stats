import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core'
import {TableModule} from 'primeng/table'
import {CommonModule} from '@angular/common'
import {TagModule} from 'primeng/tag'
import {SelectModule} from 'primeng/select'
import {ButtonModule} from 'primeng/button'
import {FormsModule} from '@angular/forms'
import {MessageModule} from 'primeng/message'
import {TabsModule} from 'primeng/tabs'
import {TooltipModule} from 'primeng/tooltip'
import {RaceList, Result, TeamResult} from '../../../interface/api-interface'
import {ResultsService} from '../../../services/results.service'
import {TeamResultsService} from '../../../services/teamresults.service'
import {RaceService} from '../../../services/race.service'

/**
 * Runs one round of ingest.
 *
 * The previous screen fetched a preview, let an admin hand-edit every row, then
 * POSTed the edited array back — a flow that existed because ingest could not
 * be re-run safely. Ingest is now idempotent (upsert on a composite key), so
 * the action is a single button and the table below it is a read-back of what
 * actually landed.
 */
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    TableModule, CommonModule, TagModule, SelectModule, ButtonModule,
    FormsModule, MessageModule, TabsModule, TooltipModule
  ],
  templateUrl: './result-admin.component.html',
  styleUrl: './result-admin.component.css'
})
export class ResultAdminComponent implements OnInit {

  races?: RaceList[]
  selectedRace?: RaceList

  driverResults?: Result[]
  teamResults?: TeamResult[]

  busy = false
  message?: string
  errorMessage?: string

  private resultsService = inject(ResultsService)
  private teamResultsService = inject(TeamResultsService)
  private raceService = inject(RaceService)
  private cdref = inject(ChangeDetectorRef)

  ngOnInit() {
    this.loadRaces()
  }

  loadRaces() {
    this.raceService.getRaceList().subscribe({
      next: (data) => {
        this.races = data
        this.selectedRace = data[data.length - 1]
        // The dropdown starts on a round, so read that round back straight
        // away. Without this the screen always opened on the "nothing stored
        // yet" empty state, even for a round that had been ingested, until the
        // admin touched the dropdown.
        this.loadStoredResults()
        this.cdref.markForCheck()
      },
      error: (err) => this.fail('Could not load the race list', err)
    })
  }

  /** Pull the round from the upstream, score it, then read back what landed. */
  ingestRound() {
    if (!this.selectedRace || this.busy) return
    this.busy = true
    this.message = undefined
    this.errorMessage = undefined

    this.resultsService.ingestRound(this.selectedRace.round).subscribe({
      next: (res: any) => {
        this.busy = false
        this.message = res?.message ?? 'Round ingested'
        this.loadStoredResults()
        this.cdref.markForCheck()
      },
      error: (err) => {
        this.busy = false
        this.fail(err?.error?.message ?? 'Ingest failed', err)
      }
    })
  }

  /** Re-score without re-fetching — used after a scoring rule change. */
  rescoreRound() {
    if (!this.selectedRace || this.busy) return
    this.busy = true
    this.message = undefined
    this.errorMessage = undefined

    this.resultsService.rescoreRound(this.selectedRace.round).subscribe({
      next: (res: any) => {
        this.busy = false
        this.message = res?.message ?? 'Round rescored'
        this.loadStoredResults()
        this.cdref.markForCheck()
      },
      error: (err) => {
        this.busy = false
        this.fail(err?.error?.message ?? 'Rescore failed', err)
      }
    })
  }

  onRaceChange() {
    this.message = undefined
    this.errorMessage = undefined
    this.loadStoredResults()
  }

  loadStoredResults() {
    if (!this.selectedRace) return
    const round = this.selectedRace.round

    this.resultsService.getResultsByRound(round).subscribe({
      next: (data) => {
        this.driverResults = data
        this.cdref.markForCheck()
      },
      error: (err) => this.fail('Could not load driver results', err)
    })

    this.teamResultsService.getTeamResultsByRound(round).subscribe({
      next: (data) => {
        this.teamResults = data
        this.cdref.markForCheck()
      },
      error: (err) => this.fail('Could not load team results', err)
    })
  }

  statusSeverity(status: string): 'success' | 'warn' | 'danger' {
    if (status === 'classified') return 'success'
    if (status === 'dnf') return 'warn'
    return 'danger'
  }

  private fail(message: string, err: unknown) {
    this.errorMessage = message
    console.error(message, err)
    this.cdref.markForCheck()
  }
}
