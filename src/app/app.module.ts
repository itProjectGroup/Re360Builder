import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TourCreatorComponent } from './tour-creator/tour-creator.component';
import { BuilderDashboardComponent } from './builder-dashboard/builder-dashboard.component'
import { PanoramaService } from './services/panorama.service';

@NgModule({
  declarations: [
    AppComponent,
    TourCreatorComponent,
    BuilderDashboardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [PanoramaService],
  bootstrap: [AppComponent]
})
export class AppModule { }
