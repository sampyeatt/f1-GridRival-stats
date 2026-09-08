import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core'
import {ButtonModule} from 'primeng/button'
import {FormsModule} from '@angular/forms'
import {CommonModule} from '@angular/common'
import {TableModule} from 'primeng/table'
import {SelectModule} from 'primeng/select'
import {MessageModule} from 'primeng/message'
import {TooltipModule} from 'primeng/tooltip'
import {InputTextModule} from 'primeng/inputtext'
import {RaceService} from '../../../services/race.service'
import {Race, RaceList} from '../../../interface/api-interface'

const ALL_ROUNDS: RaceList = {round: 0, raceName: 'All rounds', hasSprint: false, date: ''}

@Component({
  selector: 'app-race-admin',
  standalone: true,
  imports: [
    CommonModule, ButtonModule, TableModule, FormsModule,
    SelectModule, TooltipModule, InputTextModule, MessageModule
  ],
  templateUrl: './race-admin.component.html',
  styleUrl: './race-admin.component.css'
})
export class RaceAdminComponent implements OnInit {

  private raceService = inject(RaceService)
  private cdref = inject(ChangeDetectorRef)

  raceList: RaceList[] = [ALL_ROUNDS]
  races: Race[] = []
  displayedRaces: Race[] = []
  selectedRace: RaceList = ALL_ROUNDS
  clonedRace: {[round: number]: Race} = {}

  busy = false
  message?: string
  errorMessage?: string

  ngOnInit() {
    this.getAllRaces()
  }

  getAllRaces() {
    this.raceService.getAllRaces().subscribe({
      next: (data) => {
        this.races = data
        // Rebuilt rather than pushed onto, so a reload cannot duplicate entries.
        this.raceList = [ALL_ROUNDS, ...data.map(r => ({
          round: r.round, raceName: r.raceName, hasSprint: r.hasSprint, date: r.date
        }))]
        this.applyFilter()
        this.cdref.markForCheck()
      },
      error: (err) => this.fail('Could not load races', err)
    })
  }

  applyFilter() {
    this.displayedRaces = this.selectedRace.round === 0
      ? this.races
      : this.races.filter(r => r.round === this.selectedRace.round)
  }

  /** Pulls the calendar from the results API and upserts it. Safe to re-run. */
  syncSchedule() {
    this.busy = true
    this.message = undefined
    this.errorMessage = undefined

    this.raceService.syncSchedule().subscribe({
      next: (res: any) => {
        this.busy = false
        this.message = res?.message ?? 'Schedule synced'
        this.getAllRaces()
      },
      error: (err) => {
        this.busy = false
        this.fail(err?.error?.message ?? 'Schedule sync failed', err)
      }
    })
  }

  updateRace(race: Race) {
    this.raceService.updateRace(race).subscribe({
      next: () => {
        delete this.clonedRace[race.round]
        this.message = `Round ${race.round} updated`
        this.cdref.markForCheck()
      },
      error: (err) => this.fail('Could not update the race', err)
    })
  }

  deleteRace(race: Race) {
    this.raceService.deleteRace(race.round).subscribe({
      next: () => this.getAllRaces(),
      error: (err) => this.fail('Could not delete the race', err)
    })
  }

  onRowEditInit(race: Race) {
    this.clonedRace[race.round] = {...race}
  }

  onRowEditCancel(race: Race, index: number) {
    const original = this.clonedRace[race.round]
    if (!original) return
    // Written back into the array the table actually renders — the previous
    // version restored into `races` while the table showed `displayedRaces`,
    // so cancelling silently did nothing while a filter was active.
    this.displayedRaces[index] = original
    const inSource = this.races.findIndex(r => r.round === race.round)
    if (inSource !== -1) this.races[inSource] = original
    delete this.clonedRace[race.round]
  }

  private fail(message: string, err: unknown) {
    this.errorMessage = message
    console.error(message, err)
    this.cdref.markForCheck()
  }
}
