import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {PostList} from './post-list/post-list'
import {PostEditor} from './post-editor/post-editor'

const routes: Routes = [
  {path: '', component: PostList},
  {path: 'post/:id', component: PostEditor}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PostRoutingModule { }
