import {ChangeDetectorRef, Component, inject} from '@angular/core'
import {RouterModule} from '@angular/router'
import {CommonModule} from '@angular/common'
import {ButtonModule} from 'primeng/button'
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs'
import {TableModule} from 'primeng/table'
import {FormsModule, NgForm, ReactiveFormsModule} from '@angular/forms'
import {SeasonService} from '../../../services/season.service'
import {Season} from '../../../interface/api-interface'
import {IconFieldModule} from 'primeng/iconfield'

@Component({
  selector: 'app-season-admin',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    ButtonModule,
    Tab,
    TabList,
    Tabs,
    TabPanels,
    TabPanel,
    TableModule,
    ReactiveFormsModule,
    IconFieldModule,
    FormsModule
  ],
  templateUrl: './season-admin.component.html',
  styleUrl: './season-admin.component.css'
})
export class SeasonAdminComponent {

  private seasonService = inject(SeasonService)
  private cdref = inject(ChangeDetectorRef)

  seasonResults?:Season[] = []
  seasonId: number | undefined = undefined


  getAllSeasonData() {
    this.seasonService.getAllSeasons().subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        console.log(data)
        this.seasonResults = data
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })
  }

  getActiveSeasonData() {
    this.seasonService.getActiveSeason().subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        this.seasonResults = []
        this.seasonResults?.push(data)
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })
  }

  inactivateSeason(season: Season) {
    this.seasonService.inactivateSeason(season.seasonId).subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        this.getAllSeasonData()
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })
  }

  deleteSeason(season: Season) {
    this.seasonService.deleteSeason(season.seasonId).subscribe({
      next: (data) => {
        this.cdref.markForCheck()
        this.getAllSeasonData()
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })
  }

  addSeason(form: NgForm) {
    console.log('Adding season: ' + this.seasonId)
    if (form.valid) {
      this.seasonService.addSeason(this.seasonId!).subscribe({
        next: (data) => {
          this.cdref.markForCheck()
          this.getAllSeasonData()
        },
        error: (err) => {
          console.error('Error Loading posts: ', err)
        }
      })
    }
  }
}
