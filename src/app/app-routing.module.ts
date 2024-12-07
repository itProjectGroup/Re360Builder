import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TourCreatorComponent } from './tour-creator/tour-creator.component';
import { BuilderDashboardComponent } from './builder-dashboard/builder-dashboard.component';

const routes: Routes = [
  { path: '', component: TourCreatorComponent },
  { path: 'builder', component: BuilderDashboardComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
