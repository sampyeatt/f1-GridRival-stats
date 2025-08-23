import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core'
import {ButtonModule} from 'primeng/button'
import {SelectModule} from 'primeng/select'
import {TabsModule} from 'primeng/tabs'
import {TableModule} from 'primeng/table'
import {RouterModule} from '@angular/router'
import {CommonModule} from '@angular/common'
import {FormsModule, ReactiveFormsModule} from '@angular/forms'
import {IconFieldModule} from 'primeng/iconfield'
import {TeamService} from '../../../services/team.service'
import {Race, Team} from '../../../interface/api-interface'
import {TooltipModule} from 'primeng/tooltip'
import {InputTextModule} from 'primeng/inputtext'

@Component({
  selector: 'app-team-admin',
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
      InputTextModule
    ],
  templateUrl: './team-admin.component.html',
  styleUrl: './team-admin.component.css'
})
export class TeamAdminComponent implements OnInit{

  private teamService = inject(TeamService)
  private cdref = inject(ChangeDetectorRef)

  teams: Team[] = []
  clonedTeam: { [key: string]: Team } = {}

  ngOnInit() {
    this.getAllTeams()
  }

  getAllTeams(){
    this.teamService.getTeams().subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        console.log(data)
        this.teams = data
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })
  }

  addTeamsForSeasonStart(){
    this.teamService.addTeamsNewSeason().subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        console.log(data)
        this.getAllTeams()
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })
  }

  updateTeam(team: Team){
    this.teamService.updateTeam(team).subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        console.log(data)
        this.getAllTeams()
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })
    delete this.clonedTeam[team.teamId]
  }

  deleteTeam(team: Team){
    this.teamService.deleteTeam(team.teamId).subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        console.log(data)
        this.getAllTeams()
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })
  }

  onRowEditInitTeam(results: Team) {
    this.clonedTeam[results.teamId] = {...results}
  }

  onRowEditCancelTeam(results: Team, index: number) {
    this.teams![index] = this.clonedTeam[results.teamId]
    delete this.clonedTeam[results.teamId]
  }
}
