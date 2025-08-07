import {NgModule} from '@angular/core'
import {RouterModule, Routes} from '@angular/router'
import {Admin} from './admin'

const routes: Routes = [
  {
    path: '',
    component: Admin,
    children: [{path: '', loadChildren: () => import('./features/post/post-module').then(m => m.PostModule)}
    ]
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {
}
