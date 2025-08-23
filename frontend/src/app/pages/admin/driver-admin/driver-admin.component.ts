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
        data.map(team => this.teams.push(team))
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

  deleteDriver(driver: Driver){
    this.driverService.deleteDriver(driver.driverId).subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        console.log(data)
        this.getDrivers()
      },
    })
  }

  onRowEditInitDriver(results: Driver) {
    this.clonedDriver[results.driverId] = {...results}
  }

  onRowEditCancelDriver(results: Driver, index: number) {
    this.drivers![index] = this.clonedDriver[results.driverId]
    delete this.clonedDriver[results.driverId]
  }

  addDriversForSeasonStart(){
    this.driverService.addDriversNewSeason().subscribe({
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
