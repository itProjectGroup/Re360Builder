import { Component, OnInit, ElementRef, ViewChild, Input } from '@angular/core';
import * as Marzipano from 'marzipano';
import { BuilderDashboardComponent } from '../builder-dashboard/builder-dashboard.component';

// @Component({
//   selector: 'app-tour-creator',
//   template: `
//     <div class="tour-creator-container">
//       <div #panoContainer class="pano-container"></div>
//       <div class="controls">
//         <input type="file" (change)="onFileSelected($event)" accept="image/*" multiple>
//         <button (click)="createTour()">Create Tour</button>
//       </div>
//     </div>
//   `,
//   styles: [`
//     .tour-creator-container {
//       position: relative;
//       width: 100%;
//       height: 500px;
//     }
//     .pano-container {
//       position: absolute;
//       top: 0;
//       left: 0;
//       width: 100%;
//       height: 100%;
//       z-index: 1;
//     }
//     .controls {
//       position: absolute;
//       bottom: 20px;
//       left: 20px;
//       z-index: 2;
//       background-color: rgba(255, 255, 255, 0.7);
//       padding: 10px;
//       border-radius: 5px;
//     }
//   `]
// })

@Component({
  selector: 'app-tour-creator',
  templateUrl: './tour-creator.component.html',
  styleUrls: ['./tour-creator.component.scss']
})


export class TourCreatorComponent implements OnInit {
  @Input() dataFromParent: string = '';
  @ViewChild('panoContainer', { static: true }) panoContainer!: ElementRef;
  private viewer!: any;
  private scenes: any[] = [];

  ngOnInit() {
    this.initializeViewer();
  }

  initializeViewer() {
    const viewerOpts = {
      controls: {
        mouseViewMode: 'drag'
      }
    };
    this.viewer = new Marzipano.Viewer(this.panoContainer.nativeElement, viewerOpts);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        this.createScene(files[i]);
      }
    }
  }

  createScene(file: File) {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        // Create an image element
        const img = new Image();
        img.onload = () => {
          // Create the source using the correct method
          const source = Marzipano.ImageUrlSource.fromString(result);
          
          const geometry = new Marzipano.EquirectGeometry([{ width: img.width }]);
          
          const limiter = Marzipano.RectilinearView.limit.traditional(img.width, 100*Math.PI/180);
          const view = new Marzipano.RectilinearView({ yaw: 0, pitch: 0, fov: Math.PI/2 }, limiter);
          
          const scene = this.viewer.createScene({
            source: source,
            geometry: geometry,
            view: view,
            pinFirstLevel: true
          });
          
          this.scenes.push(scene);
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  }

  createTour() {
    if (this.scenes.length > 0) {
      this.scenes[0].switchTo();
    }
  }
}