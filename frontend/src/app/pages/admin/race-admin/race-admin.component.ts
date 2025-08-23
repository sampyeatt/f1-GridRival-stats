import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core'
import {ButtonModule} from 'primeng/button'
import {FormsModule, ReactiveFormsModule} from '@angular/forms'
import {CommonModule} from '@angular/common'
import {TabsModule} from 'primeng/tabs'
import {TableModule} from 'primeng/table'
import {RaceService} from '../../../services/race.service'
import {RaceList, Race} from '../../../interface/api-interface'
import {SelectModule} from 'primeng/select'
import {IconFieldModule} from 'primeng/iconfield'
import {RouterModule} from '@angular/router'
import {RippleModule} from 'primeng/ripple'
import {TooltipModule} from 'primeng/tooltip'
import {InputTextModule} from 'primeng/inputtext'

@Component({
  selector: 'app-race-admin',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    ButtonModule,
    TabsModule,
    TableModule,
    ReactiveFormsModule,
    IconFieldModule,
    FormsModule,
    SelectModule,
    RippleModule,
    TooltipModule,
    InputTextModule
  ],
  templateUrl: './race-admin.component.html',
  styleUrl: './race-admin.component.css'
})
export class RaceAdminComponent implements OnInit {

  private raceService = inject(RaceService)
  private cdref = inject(ChangeDetectorRef)

  raceList: RaceList[] = [{
    meeting_key: 0,
    meeting_name: 'All Races'
  }]
  races?: Race[] = []
  displayedRaces?: Race[] = []
  selectedRace?: RaceList
  clonedRace: { [key: string]: Race } = {}


  ngOnInit() {
    this.getRaceList()
    this.getAllRaces()
  }

  getRaceList() {
    this.raceService.getRaceList().subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        data.map(race => this.raceList.push(race))
        this.selectedRace = this.raceList[0]
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })
  }

  getAllRaces() {
    this.raceService.getAllRaces().subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        console.log(data)
        this.races = data
        this.displayedRaces = this.races
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })
  }

  getRaceById() {
    if (this.selectedRace && this.selectedRace.meeting_key !== 0 && this.races) {
      this.displayedRaces = this.races.filter(result => result.meeting_key === this.selectedRace!.meeting_key)
    } else if (this.selectedRace && this.selectedRace.meeting_key === 0) {
      this.displayedRaces = this.races
    }
  }

  updateRace(race: Race) {
    this.raceService.updateRace(race).subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        console.log(data)
        // this.getAllRaces()
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })

    delete this.clonedRace[race.raceId]
  }

  deleteRace(race: Race) {
    this.raceService.deleteRace(race.meeting_key).subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        console.log(data)
        this.getAllRaces()
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })
  }

  addRace() {
    this.raceService.addRaceBulk().subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        console.log(data)
        this.getAllRaces()
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })
  }


  onRowEditInitRace(results: Race) {
    this.clonedRace[results.raceId] = {...results}
  }

  onRowEditCancelRace(results: Race, index: number) {
    this.races![index] = this.clonedRace[results.raceId]
    delete this.clonedRace[results.raceId]
  }
}
