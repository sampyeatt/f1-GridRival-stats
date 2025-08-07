import {NgModule} from '@angular/core'
import {RouterModule, Routes} from '@angular/router'
import {Public} from './public'

const routes: Routes = [
  {
    path: '', component: Public, children: [
      {path: '', loadChildren: () => import('./feautes/post/post-module').then(m => m.PostModule)}
    ],
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PublicRoutingModule {
}
