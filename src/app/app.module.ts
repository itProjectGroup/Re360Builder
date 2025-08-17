import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TourCreatorComponent } from './tour-creator/tour-creator.component';
import { BuilderDashboardComponent } from './builder-dashboard/builder-dashboard.component'
import { PanoramaService } from './services/panorama-builder/panorama.service';
import { HotspotInfoService } from './services/hotspot/hotspot-info.service';
import { MessageService } from './services/message/message.service';

// Material imports
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

// Custom components
import { ContextMenuComponent } from './components/context-menu/context-menu.component';
import { LinkHotspotDialogComponent } from './components/link-hotspot-dialog/link-hotspot-dialog.component';
import { InfoHotspotDialogComponent } from './components/info-hotspot-dialog/info-hotspot-dialog.component';
import { MessagePopupComponent } from './components/message-popup/message-popup.component';

@NgModule({
  declarations: [
    AppComponent,
    TourCreatorComponent,
    BuilderDashboardComponent,
    ContextMenuComponent,
    LinkHotspotDialogComponent,
    InfoHotspotDialogComponent,
    MessagePopupComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    MatCheckboxModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
  ],
  providers: [
    PanoramaService, 
    HotspotInfoService, 
    MessageService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
