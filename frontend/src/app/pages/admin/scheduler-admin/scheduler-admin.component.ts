import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core'
import {CommonModule} from '@angular/common'
import {TableModule} from 'primeng/table'
import {ButtonModule} from 'primeng/button'
import {TagModule} from 'primeng/tag'
import {MessageModule} from 'primeng/message'
import {TooltipModule} from 'primeng/tooltip'
import {Observable, forkJoin} from 'rxjs'
import {IngestOutcome, IngestRun, SchedulerStatus, SeasonRefreshSummary} from '../../../interface/api-interface'
import {SchedulerService} from '../../../services/scheduler.service'

/**
 * Visibility for the scheduled ingest.
 *
 * Ingest used to be entirely manual, so "did it run?" was answered by
 * remembering whether you had clicked the button. Now that it runs on its own,
 * this screen is where you find out what it did and why.
 */
@Component({
  selector: 'app-scheduler-admin',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, MessageModule, TooltipModule],
  templateUrl: './scheduler-admin.component.html'
})
export class SchedulerAdminComponent implements OnInit {

  status?: SchedulerStatus
  runs?: IngestRun[]

  busy = false
  message?: string
  errorMessage?: string

  private schedulerService = inject(SchedulerService)
  private cdref = inject(ChangeDetectorRef)

  ngOnInit() {
    this.reload()
  }

  reload() {
    forkJoin({
      status: this.schedulerService.getStatus(),
      runs: this.schedulerService.getRuns()
    }).subscribe({
      next: ({status, runs}) => {
        this.status = status
        this.runs = runs
        this.cdref.markForCheck()
      },
      error: (err) => this.fail('Could not load scheduler status', err)
    })
  }

  /** Runs whatever is currently due, rather than waiting for the next tick. */
  runNow() {
    this.act(this.schedulerService.runTick(), 'Tick complete')
  }

  /** Refreshes the calendar and the driver line-up. */
  syncSeason() {
    this.act(this.schedulerService.syncSeason(), 'Season synced')
  }

  /**
   * Rebuilds everything for the current season in one pass.
   *
   * The starting point for a new season: without it the first sync of a season
   * meant running the backfill script on the host, because these screens could
   * only reach one round at a time.
   */
  rebuildSeason() {
    this.act(this.schedulerService.refreshSeason(), (summary: SeasonRefreshSummary) => {
      const scored = summary.rounds.filter(round => round.outcome === 'ingested').length
      const failed = summary.rounds.filter(round => round.outcome === 'failed').length
      return `Season ${summary.seasonId}: ${scored} of ${summary.rounds.length} rounds scored, `
        + `${summary.drivers} drivers, ${summary.teams} teams`
        + (failed ? ` — ${failed} round(s) failed, see Recent runs` : '')
    })
  }

  /** Manual override for one round, bypassing the checkpoint schedule. */
  runRound(round: number) {
    this.act(this.schedulerService.runRound(round), `Round ${round} run`)
  }

  private act(request: Observable<any>, success: string | ((result: any) => string)) {
    if (this.busy) return
    this.busy = true
    this.message = undefined
    this.errorMessage = undefined

    request.subscribe({
      next: (result) => {
        this.busy = false
        this.message = typeof success === 'string' ? success : success(result)
        this.reload()
      },
      error: (err) => {
        this.busy = false
        this.fail(err?.error?.message ?? 'The scheduler request failed', err)
      }
    })
  }

  outcomeSeverity(outcome: IngestOutcome): 'success' | 'info' | 'warn' | 'danger' {
    if (outcome === 'ingested') return 'success'
    if (outcome === 'unchanged') return 'info'
    if (outcome === 'skipped') return 'warn'
    return 'danger'
  }

  private fail(message: string, err: unknown) {
    this.errorMessage = message
    console.error(message, err)
    this.cdref.markForCheck()
  }
}
