import {Component, OnInit} from '@angular/core'
import {TableModule} from 'primeng/table'
import {CommonModule} from '@angular/common'
import {Result, ResultsService} from '../../services/results.service'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    TableModule, CommonModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})

export class DashboardComponent {
  results!: Result[];

  constructor(private resultsService: ResultsService) {}

  ngOnInit() {
    this.resultsService.getResults().subscribe({
      next:(data)=>{
        this.results = data;
      },
      error:(err)=>{
        console.error('Error Loading posts: ', err);
      }
    });
  }
}
