import {Component, inject} from '@angular/core'
// import {MessageService} from 'primeng/api'
import {TableModule} from 'primeng/table'
import {ToastModule} from 'primeng/toast'
import {CommonModule} from '@angular/common'
import {TagModule} from 'primeng/tag'
import {SelectModule} from 'primeng/select'
import {ButtonModule} from 'primeng/button'
import {InputTextModule} from 'primeng/inputtext'
import {Result} from '../../interface/api-interface'
import {ResultsService} from '../../services/results.service'
import {FormsModule} from '@angular/forms'


@Component({
  selector: 'app-admin',
  imports: [TableModule, ToastModule, CommonModule, TagModule, SelectModule, ButtonModule, InputTextModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {

  results?: Result[]

  clonedResult: { [s: number]: Result } = {}

  public resultsService = inject(ResultsService)
  // private messageService = inject(MessageService)

  ngOnInit() {


  }

  onSubmit() {
    this.resultsService.getNewResults().subscribe({
        next: (data) => {
          this.results = data
        },
        error: (err) => {
          console.error('Error Loading posts: ', err)
        }
      }
    )
  }

  onRowEditInit(results: Result) {
    this.clonedResult[results.id] = {...results}
  }

  onRowEditSave(results: Result) {
    if (results.cost > 0) {
      delete this.clonedResult[results.id]
      // this.messageService.add({severity: 'success', summary: 'Success', detail: 'Product is updated'})
    } else {
      // this.messageService.add({severity: 'error', summary: 'Error', detail: 'Invalid Cost'})
    }
  }

  onRowEditCancel(results: Result, index: number) {
    this.results![index] = this.clonedResult[results.id]
    delete this.clonedResult[results.id]
  }

}
