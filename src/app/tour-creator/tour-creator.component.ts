import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PanoramaService } from '../services/panorama.service';

@Component({
  selector: 'app-tour-creator',
  templateUrl: './tour-creator.component.html'
})
export class TourCreatorComponent {
  constructor(
    private router: Router,
    private panoramaService: PanoramaService
  ) {}

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      console.log('Files selected:', files);
      this.panoramaService.addPanoramas(Array.from(files));
      this.router.navigate(['/builder']);
    }
  }
}