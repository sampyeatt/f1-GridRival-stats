import { Component } from '@angular/core';
import {Header} from './core/components/header/header'
import {Footer} from './core/components/footer/footer'
import {RouterModule} from '@angular/router'

@Component({
  selector: 'app-public',
  imports: [
    Header,
    Footer,
    RouterModule,
  ],
  templateUrl: './public.html',
  styleUrl: './public.scss'
})
export class Public {

}
