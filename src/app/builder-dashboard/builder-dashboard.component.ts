import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { PanoramaService, PanoramaImage } from '../services/panorama-builder/panorama.service';
import * as Marzipano from 'marzipano';
import { HotspotInfoService, Hotspot } from '../services/hotspot/hotspot-info.service';
import { MatDialog } from '@angular/material/dialog';
import { LinkHotspotDialogComponent } from '../components/link-hotspot-dialog/link-hotspot-dialog.component';
import { InfoHotspotDialogComponent } from '../components/info-hotspot-dialog/info-hotspot-dialog.component';
import { MessageService } from '../services/message/message.service';

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
  currentScene?: any;
  private pendingPanorama?: PanoramaImage;
  private autorotate: boolean = false;
  autorotateConfig: any;
  
  // Context menu properties
  contextMenuVisible = false;
  contextMenuX = 0;
  contextMenuY = 0;
  clickPosition: { yaw: number, pitch: number } = { yaw: 0, pitch: 0 };

  constructor(
    private panoramaService: PanoramaService,
    private cdr: ChangeDetectorRef,
    private hotspotInfoService: HotspotInfoService,
    private dialog: MatDialog,
    private messageService: MessageService
  ) {
    // Subscribe to hotspot edit and delete events
    this.hotspotInfoService.editHotspot$.subscribe(hotspot => {
      if (hotspot.type === 'link') {
        this.editLinkHotspot(hotspot);
      } else if (hotspot.type === 'info') {
        this.editInfoHotspot(hotspot);
      }
    });
    
    this.hotspotInfoService.deleteHotspot$.subscribe(hotspot => {
      this.deleteHotspot(hotspot);
    });
  }

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

    this.autorotateConfig = (Marzipano as any).autorotate({
      yawSpeed: 0.1,
      targetPitch: 0,
      targetFov: Math.PI/2
    });
  }

  ngAfterViewInit() {
    const viewerOpts = {
      controls: {
        mouseViewMode: 'drag'
      }
    };
    
    this.viewer = new Marzipano.Viewer(this.panoViewer.nativeElement, viewerOpts);
    
    // Add context menu event listener
    this.panoViewer.nativeElement.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    
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
        // Check if the viewer is initialized
        if (!this.viewer) {
          throw new Error('Viewer is not initialized');
        }

        // Clear existing scenes
        this.viewer.destroyAllScenes();

        // Create tile source
        const source = Marzipano.ImageUrlSource.fromString(this.selectedPanorama?.url ?? '');

        // Create geometry
        const geometry = new Marzipano.EquirectGeometry([{
          width: image.width,
          height: image.height,
          tileWidth: image.width,
          tileHeight: image.height
        }]);

        // Create view with initial parameters
        const limiter = Marzipano.RectilinearView.limit.traditional(4096, 100 * Math.PI / 180);
        let viewOptions = null;

        // Set initial view if available
        if (this.selectedPanorama && this.selectedPanorama.initialView) {
          viewOptions = {
            yaw: this.selectedPanorama.initialView.yaw,
            pitch: this.selectedPanorama.initialView.pitch
          };
        }

        const view = new Marzipano.RectilinearView(viewOptions, limiter);

        // Create and switch to scene
        const scene = this.viewer.createScene({
          source: source,
          geometry: geometry,
          view: view,
          pinFirstLevel: true
        });

        // Check if the scene was created successfully
        if (!scene) {
          throw new Error('Failed to create scene');
        }

        scene.switchTo({ transitionDuration: 0 });
        this.currentScene = scene;
        console.log('Scene created and switched successfully');

        // Load hotspots for this scene
        if (this.selectedPanorama) {
          this.loadHotspotsForScene(this.selectedPanorama.id);
        }

      } catch (error) {
        console.error('Error creating scene:', error);
      }
    };

    image.onerror = (error) => {
      console.error('Error loading image:', error);
    };
  }

  // Load hotspots for the current scene
  private loadHotspotsForScene(sceneId: string) {
    if (!this.currentScene) return;
    
    const hotspots = this.hotspotInfoService.getHotspotsForScene(sceneId);
    
    hotspots.forEach(hotspot => {
      if (hotspot.type === 'link') {
        this.hotspotInfoService.createLinkHotspotElement(
          hotspot, 
          this.currentScene, 
          (target) => this.onHotspotClick(target)
        );
      } else if (hotspot.type === 'info') {
        this.hotspotInfoService.createInfoHotspotElement(hotspot, this.currentScene);
      }
    });
  }

  // Handle hotspot click - switch to target panorama
  onHotspotClick(targetId: string): void {
    const targetPanorama = this.panoramas.find(p => p.id === targetId);
    if (!targetPanorama) return;
    
    // Find the hotspot that links to this target to get initial view settings
    const currentSceneHotspots = this.hotspotInfoService.getHotspotsForScene(this.selectedPanorama?.id || '');
    const linkHotspot = currentSceneHotspots.find(h => h.type === 'link' && h.target === targetId);
    
    this.selectPanorama(targetPanorama);
    
    // Apply initial view if specified
    if (linkHotspot?.targetInitialView && this.viewer) {
      setTimeout(() => {
        const view = this.viewer.view();
        view.setYaw(linkHotspot.targetInitialView!.yaw);
        view.setPitch(linkHotspot.targetInitialView!.pitch);
      }, 100);
    }
  }

  // Handle right-click to open context menu
  handleContextMenu(event: MouseEvent) {
    event.preventDefault();
    
    // Only show context menu if we have a scene
    if (!this.currentScene || !this.selectedPanorama) return;
    
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
    this.contextMenuVisible = true;
    
    // Convert screen coordinates to panorama coordinates (yaw/pitch)
    const rect = this.panoViewer.nativeElement.getBoundingClientRect();
    const coords = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    
    // Get the current view from the scene
    const view = this.currentScene.view();
    
    // Calculate where the user clicked in the panorama (yaw/pitch)
    const viewCoords = view.screenToCoordinates(coords);
    this.clickPosition = {
      yaw: viewCoords.yaw,
      pitch: viewCoords.pitch
    };
    
    this.cdr.detectChanges();
  }

  // Close context menu
  closeContextMenu() {
    this.contextMenuVisible = false;
  }

  // Open dialog to add link hotspot
  addLinkHotspot() {
    if (!this.selectedPanorama || !this.viewer) return;
    
    // Get current view orientation - fix the position() method call
    const view = this.viewer.view();
    const viewPosition = {
      yaw: view.yaw(),
      pitch: view.pitch()
    };
    
    const dialogRef = this.dialog.open(LinkHotspotDialogComponent, {
      width: '500px', // Increased width for new controls
      data: {
        panoramas: this.panoramas,
        currentPanoramaId: this.selectedPanorama.id,
        yaw: this.clickPosition.yaw,
        pitch: this.clickPosition.pitch,
        currentView: viewPosition
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.selectedPanorama) {
        // Add the hotspot to the service
        this.hotspotInfoService.addHotspot(this.selectedPanorama.id, result);
        
        // Display it in the current scene
        this.hotspotInfoService.createLinkHotspotElement(
          result, 
          this.currentScene, 
          (target) => this.onHotspotClick(target)
        );
      }
    });
  }

  // Open dialog to add info hotspot
  addInfoHotspot() {
    if (!this.selectedPanorama) return;
    
    const dialogRef = this.dialog.open(InfoHotspotDialogComponent, {
      width: '400px',
      data: {
        yaw: this.clickPosition.yaw,
        pitch: this.clickPosition.pitch
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.selectedPanorama) {
        // Add the hotspot to the service
        this.hotspotInfoService.addHotspot(this.selectedPanorama.id, result);
        
        // Display it in the current scene
        this.hotspotInfoService.createInfoHotspotElement(result, this.currentScene);
      }
    });
  }

  // Export hotspots to JSON
  exportHotspots() {
    const jsonData = this.hotspotInfoService.exportHotspotsData();
    
    // Create a download link
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hotspots.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Import hotspots from JSON file
  importHotspots(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const jsonData = e.target.result;
        this.hotspotInfoService.importHotspotsData(jsonData);
        
        // Reload hotspots for the current scene
        if (this.selectedPanorama) {
          this.loadHotspotsForScene(this.selectedPanorama.id);
        }
      } catch (error) {
        console.error('Error importing hotspots:', error);
      }
    };
    reader.readAsText(file);
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

  toggleAutorotate(event: any): void {
    this.autorotate = event.target.checked;

    if (this.autorotate) {
      this.viewer.startMovement(this.autorotateConfig); 
    } else {
      this.viewer.stopMovement();
    }
  }

  // Add methods to edit hotspots
  editLinkHotspot(hotspot: Hotspot): void {
    if (!this.selectedPanorama || !this.viewer) return;
    
    // Get current view orientation - fix the position() method call
    const view = this.viewer.view();
    const viewPosition = {
      yaw: view.yaw(),
      pitch: view.pitch()
    };
    
    const dialogRef = this.dialog.open(LinkHotspotDialogComponent, {
      width: '500px',
      data: {
        panoramas: this.panoramas,
        currentPanoramaId: this.selectedPanorama.id,
        yaw: hotspot.yaw,
        pitch: hotspot.pitch,
        currentView: viewPosition,
        hotspot: hotspot
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.selectedPanorama) {
        // Remove old hotspot
        this.hotspotInfoService.removeHotspot(this.selectedPanorama.id, hotspot.id);
        
        // Add updated hotspot
        this.hotspotInfoService.addHotspot(this.selectedPanorama.id, result);
        
        // Reload all hotspots
        this.reloadCurrentSceneHotspots();
      }
    });
  }

  editInfoHotspot(hotspot: Hotspot): void {
    if (!this.selectedPanorama) return;
    
    const dialogRef = this.dialog.open(InfoHotspotDialogComponent, {
      width: '400px',
      data: {
        yaw: hotspot.yaw,
        pitch: hotspot.pitch,
        hotspot: hotspot // Pass existing hotspot
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.selectedPanorama) {
        // Remove old hotspot
        this.hotspotInfoService.removeHotspot(this.selectedPanorama.id, hotspot.id);
        
        // Add updated hotspot
        this.hotspotInfoService.addHotspot(this.selectedPanorama.id, result);
        
        // Reload all hotspots
        this.reloadCurrentSceneHotspots();
      }
    });
  }

  deleteHotspot(hotspot: Hotspot): void {
    if (!this.selectedPanorama) return;

    // Remove the hotspot
    this.hotspotInfoService.removeHotspot(this.selectedPanorama.id, hotspot.id);
    
    // Reload all hotspots
    this.reloadCurrentSceneHotspots();
  }

  // Helper method to reload all hotspots for the current scene
  reloadCurrentSceneHotspots(): void {
    if (!this.selectedPanorama || !this.currentScene) return;
    
    // Clear existing hotspots
    const container = this.currentScene.hotspotContainer();
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    // Reload all hotspots
    this.loadHotspotsForScene(this.selectedPanorama.id);
  }

  setInitialView() {
    if (!this.selectedPanorama || !this.viewer || !this.currentScene) return;
    
    // Get current view orientation
    const view = this.currentScene.view();
    const initialView = {
      yaw: view.yaw(),
      pitch: view.pitch()
    };
    
    // Save this as the initial view for this panorama
    this.panoramaService.setInitialViewForPanorama(this.selectedPanorama.id, initialView);
    
    // Show message using the message service instead of alert
    this.messageService.success(`Initial view set for ${this.selectedPanorama.name}`);
  }
}
