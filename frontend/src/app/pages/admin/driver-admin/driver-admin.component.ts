import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core'
import {ButtonModule} from 'primeng/button'
import {TabsModule} from 'primeng/tabs'
import {TableModule} from 'primeng/table'
import {RouterModule} from '@angular/router'
import {CommonModule} from '@angular/common'
import {FormsModule, ReactiveFormsModule} from '@angular/forms'
import {IconFieldModule} from 'primeng/iconfield'
import {SelectModule} from 'primeng/select'
import {DriverService} from '../../../services/driver.service'
import {Driver, Team} from '../../../interface/api-interface'
import {TeamService} from '../../../services/team.service'
import {TooltipModule} from 'primeng/tooltip'
import {InputTextModule} from 'primeng/inputtext'
import {ToggleButtonModule} from 'primeng/togglebutton'

@Component({
  selector: 'app-driver-admin',
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
    TooltipModule,
    InputTextModule,
    ToggleButtonModule
  ],
  templateUrl: './driver-admin.component.html',
  styleUrl: './driver-admin.component.css'
})
export class DriverAdminComponent implements OnInit{
  private driverService = inject(DriverService)
  private teamService = inject(TeamService)
  private cdref = inject(ChangeDetectorRef)

  drivers: Driver[] = []
  displayedDrivers: Driver[] = []
  teams: Team[] = [{
      teamId: 'all',
      teamName: 'All Teams'
    }]
  selectedTeam?: Team
  clonedDriver: { [key: string]: Driver } = {}

  ngOnInit() {
    this.getDrivers()
    this.getTeams()
  }

  getDrivers() {
    this.driverService.getDrivers().subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        console.log(data)
        this.drivers = data
        this.displayedDrivers = this.drivers
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })
  }

  getTeams(){
    this.teamService.getTeams().subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        console.log(data)
        // Rebuilt rather than pushed onto, so a reload cannot duplicate rows.
        this.teams = [{teamId: 'all', teamName: 'All teams'}, ...data]
        this.selectedTeam = this.teams[0]
      }
    })
  }

  filterResults(){
    if(this.selectedTeam && this.selectedTeam.teamId !== 'all'){
      this.displayedDrivers = this.drivers.filter(result => result.teamId === this.selectedTeam!.teamId)
    } else if(this.selectedTeam && this.selectedTeam.teamId === 'all'){
      this.displayedDrivers = this.drivers
    }
  }

  updateDriver(driver: Driver){
    this.driverService.updateDriver(driver).subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        console.log(data)
        this.getDrivers()
      },
      error: (err) => {}
    })
    delete this.clonedDriver[driver.driverId]
  }

  /**
   * Drivers are not deleted — a driver who leaves mid-season still owns their
   * scored rounds. Mark them inactive instead, via the row editor.
   */
  deactivateDriver(driver: Driver){
    this.driverService.updateDriver({driverId: driver.driverId, active: false}).subscribe({
      next: () => this.getDrivers(),
      error: (err) => console.error('Could not deactivate the driver', err)
    })
  }

  onRowEditInitDriver(results: Driver) {
    this.clonedDriver[results.driverId] = {...results}
  }

  onRowEditCancelDriver(results: Driver, index: number) {
    const original = this.clonedDriver[results.driverId]
    if (!original) return
    // Restored into the array the table actually renders. Writing only into
    // `drivers` meant cancelling did nothing visible while a team filter was
    // active — the same defect race-admin had.
    this.displayedDrivers[index] = original
    const inSource = this.drivers.findIndex(d => d.driverId === results.driverId)
    if (inSource !== -1) this.drivers[inSource] = original
    delete this.clonedDriver[results.driverId]
  }

  /** Pulls drivers and constructors from the results API. Safe to re-run. */
  syncDrivers(){
    this.driverService.syncDrivers().subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        console.log(data)
        this.getDrivers()
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })
  }

}
