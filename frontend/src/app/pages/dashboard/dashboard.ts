import {Component, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core'
import {TableModule} from 'primeng/table'
import {CommonModule} from '@angular/common'
import {ButtonModule} from 'primeng/button'
import {FormsModule} from '@angular/forms'
import {ResultsService} from '../../services/results.service'
import {Result} from '../../interface/api-interface'
import {BadgeModule} from 'primeng/badge'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    TableModule, CommonModule, ButtonModule, BadgeModule, FormsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})

export class DashboardComponent {
  results!: Result[]

  public resultsService = inject(ResultsService)

  ngOnInit() {
    this.resultsService.getResults().subscribe({
      next: (data) => {
        this.results = data
      },
      error: (err) => {
        console.error('Error Loading posts: ', err)
      }
    })
  }

  resultSeverity(result: Result) {
    if (result.positionsForMoney > 1) return 'danger'
    else if (result.positionsForMoney <= 1 && result.positionsForMoney >= -1) return 'warning'
    else return 'success'
  }
}
