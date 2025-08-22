import { Component } from '@angular/core';
import {RouterModule} from '@angular/router'
import {CommonModule} from '@angular/common'

@Component({
  selector: 'app-season-admin',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule
  ],
  templateUrl: './season-admin.component.html',
  styleUrl: './season-admin.component.css'
})
export class SeasonAdminComponent {

}
