import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { PanoramaService, PanoramaImage } from '../services/panorama.service';
import * as Marzipano from 'marzipano';

@Component({
  selector: 'app-builder-dashboard',
  templateUrl: './builder-dashboard.component.html',
  styleUrls: ['./builder-dashboard.component.scss']
})
export class BuilderDashboardComponent implements OnInit, AfterViewInit {
  panoramas: PanoramaImage[] = [];
  selectedPanorama?: PanoramaImage;
  @ViewChild('panoViewer') panoViewer!: ElementRef;
  viewer?: any;
  private pendingPanorama?: PanoramaImage;

  constructor(
    private panoramaService: PanoramaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.panoramaService.panoramas$.subscribe(panoramas => {
      console.log('Received panoramas:', panoramas);
      this.panoramas = panoramas;
      if (panoramas.length > 0) {
        if (this.viewer) {
          this.selectPanorama(panoramas[0]);
        } else {
          this.pendingPanorama = panoramas[0];
        }
      }
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit() {
    const viewerOpts = {
      controls: {
        mouseViewMode: 'drag'
      }
    };
    this.viewer = new Marzipano.Viewer(this.panoViewer.nativeElement, viewerOpts);
    
    if (this.pendingPanorama) {
      setTimeout(() => {
        this.selectPanorama(this.pendingPanorama!);
        this.pendingPanorama = undefined;
        this.cdr.detectChanges();
      });
    }
  }

  selectPanorama(panorama: PanoramaImage) {
    console.log('Selecting panorama:', panorama);
    this.selectedPanorama = panorama;
    if (this.viewer) {
      this.initViewer();
    } else {
      this.pendingPanorama = panorama;
    }
  }

  private initViewer() {
    if (!this.selectedPanorama || !this.viewer) {
      console.log('Missing required elements:', {
        selectedPanorama: !!this.selectedPanorama,
        viewer: !!this.viewer
      });
      return;
    }

    console.log('Initializing viewer with:', this.selectedPanorama.url);

    const image = new Image();
    image.src = this.selectedPanorama.url;

    image.onload = () => {
      try {
        // Clear existing scenes
        this.viewer.destroyAllScenes();

        // Create tile source - using the correct Marzipano API
        const source = Marzipano.ImageUrlSource.fromString(
          this.selectedPanorama?.url ?? ''
        );

        // Add error handling
        source.addEventListener('error', function(e: ErrorEvent) {
          console.error('Error loading panorama:', e);
        });

        // Create geometry
        const geometry = new Marzipano.EquirectGeometry([{
          width: image.width,
          height: image.height,
          tileWidth: image.width,
          tileHeight: image.height
        }]);

        // Create view
        const limiter = Marzipano.RectilinearView.limit.traditional(
          4096,
          100 * Math.PI / 180
        );
        const view = new Marzipano.RectilinearView(null, limiter);

        // Create and switch to scene
        const scene = this.viewer.createScene({
          source: source,
          geometry: geometry,
          view: view,
          pinFirstLevel: true
        });
        
        scene.switchTo({ transitionDuration: 0 });
        console.log('Scene created and switched successfully');
      } catch (error) {
        console.error('Error creating scene:', error);
      }
    };

    image.onerror = (error) => {
      console.error('Error loading image:', error);
    };
  }

  trackByFn(index: number, item: PanoramaImage) {
    return item.id;
  }

  addMorePanoramas() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = 'image/*';
    
    fileInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        this.panoramaService.addPanoramas(Array.from(target.files));
      }
    };

    fileInput.click();
  }
}
