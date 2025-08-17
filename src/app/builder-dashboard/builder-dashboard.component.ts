import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { PanoramaService, PanoramaImage } from '../services/panorama-builder/panorama.service';
import * as Marzipano from 'marzipano';
import { HotspotInfoService, Hotspot } from '../services/hotspot/hotspot-info.service';
import { MatDialog } from '@angular/material/dialog';
import { LinkHotspotDialogComponent } from '../components/link-hotspot-dialog/link-hotspot-dialog.component';
import { InfoHotspotDialogComponent } from '../components/info-hotspot-dialog/info-hotspot-dialog.component';
import { MessageService } from '../services/message/message.service';
import { ProjectDataService } from '../services/project-data.service';
import { MatIconModule } from '@angular/material/icon';
import * as JSZip from 'jszip';
import { saveAs } from 'file-saver';


@Component({
  selector: 'app-builder-dashboard',
  templateUrl: './builder-dashboard.component.html',
  styleUrls: ['./builder-dashboard.component.scss']
})
export class BuilderDashboardComponent implements OnInit, AfterViewInit {
  panoramas: PanoramaImage[] = [];
  selectedPanorama?: PanoramaImage; // hold ths id for currently select 360 image panorama
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
  clickPosition: { yaw: number, pitch: number, fov: number } = { yaw: 0, pitch: 0, fov: 0 };

  projectTitle: string = '';
  editingTitle: boolean = false;

  // Instruction overlay state
  instructionSteps: string[] = [
    'Right-click anywhere on the panorama to add hotspots.',
    'Use the sidebar to switch between different panoramas.',
    'Click on a hotspot to edit or delete it.',
    'Use the Export button to save your hotspots.'
  ];
  currentInstructionStep: number = 0;
  showInstructions: boolean = true;

  constructor(
    private panoramaService: PanoramaService,
    private cdr: ChangeDetectorRef,
    private hotspotInfoService: HotspotInfoService,
    private dialog: MatDialog,
    private messageService: MessageService,
    private projectDataService: ProjectDataService
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
    this.projectDataService.initializeProjectData();

    // Subscribe to project title changes
    this.projectDataService.projectData$.subscribe(data => {
      this.projectTitle = data.name;
    });

    this.panoramaService.panoramas$.subscribe(panoramas => {
      console.log('Received panoramas:', panoramas);
      // for (const panorama of panoramas) {
      //   this.projectDataService.addNewScene(panorama);
      // }
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

    for (const panorama of this.panoramas) {
      this.projectDataService.addNewScene(panorama);
    }

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

        // Update faceSize in project data
        if (this.selectedPanorama) {
          this.projectDataService.updateSceneFaceSize(this.selectedPanorama.id, image.width);
        }

        // Create view with initial parameters
        const faceSize = image.width ?? 4096; // Dynamically get the width of the loaded image
        const limiter = Marzipano.RectilinearView.limit.traditional(faceSize, 100 * Math.PI / 180);
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
    if (!targetPanorama || !this.viewer) return;
    
    // Find the hotspot that links to this target to get initial view settings
    const currentSceneHotspots = this.hotspotInfoService.getHotspotsForScene(this.selectedPanorama?.id || '');
    const linkHotspot = currentSceneHotspots.find(h => h.type === 'link' && h.target === targetId);
    
    // Instead of calling selectPanorama(), we'll handle the transition here
    this.selectedPanorama = targetPanorama;
    
    const image = new Image();
    image.src = targetPanorama.url;
    
    image.onload = () => {
      // Create the geometry and source for the new scene
      const source = Marzipano.ImageUrlSource.fromString(targetPanorama.url);
      const geometry = new Marzipano.EquirectGeometry([{
        width: image.width,
        height: image.height,
        tileWidth: image.width,
        tileHeight: image.height
      }]);
      
      // Create view with initial parameters
      const faceSize = image.width ?? 4096; // Dynamically get the width of the loaded image
      const limiter = Marzipano.RectilinearView.limit.traditional(faceSize, 100 * Math.PI / 180);
      
      // Set initial view based on hotspot target or panorama default
      let viewOptions = null;
      if (linkHotspot?.targetInitialView) {
        viewOptions = {
          yaw: linkHotspot.targetInitialView.yaw,
          pitch: linkHotspot.targetInitialView.pitch
        };
      } else if (targetPanorama.initialView) {
        viewOptions = {
          yaw: targetPanorama.initialView.yaw,
          pitch: targetPanorama.initialView.pitch
        };
      }
      
      const view = new Marzipano.RectilinearView(viewOptions, limiter);
      
      // Create the new scene
      const newScene = this.viewer.createScene({
        source: source,
        geometry: geometry,
        view: view,
        pinFirstLevel: true
      });
      
      // Define transition effect
      const transitionDuration = 1000;  // 1 second transition
      
      // Choose a transition effect - can be 'crossFade', 'fadeIn', 'fadeOut', etc.
      const transitionEffect = { 
        transitionDuration: transitionDuration,
        transitionUpdate: (value: number, newScene: any, oldScene: any) => {
          // Fade out the old scene and fade in the new scene
          newScene.layer().setEffects({ opacity: value });
          if (oldScene) {
            oldScene.layer().setEffects({ opacity: 1 - value });
          }
        }
      };
      
      // Switch to the new scene with transition
      newScene.switchTo(transitionEffect);
      
      // Update current scene reference
      this.currentScene = newScene;
      
      // Load hotspots for the new scene after transition
      setTimeout(() => {
        this.loadHotspotsForScene(targetPanorama.id);
      }, transitionDuration); 
    };
    
    image.onerror = (error) => {
      console.error('Error loading panorama image:', error);
      this.messageService.error('Failed to load panorama');
    };
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
      pitch: viewCoords.pitch,
      fov: view.fov()
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
      pitch: view.pitch(),
      fov: view.fov()
    };
    
    const dialogRef = this.dialog.open(LinkHotspotDialogComponent, {
      width: '500px', // Increased width for new controls
      data: {
        panoramas: this.panoramas,
        currentPanoramaId: this.selectedPanorama.id,
        yaw: this.clickPosition.yaw,
        pitch: this.clickPosition.pitch,
        fov: this.clickPosition.fov,
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

        //Add hotspot to export
        this.projectDataService.setExportHotspot(this.selectedPanorama.id, result)
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
        pitch: this.clickPosition.pitch,
        fov: this.clickPosition.fov
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.selectedPanorama) {
        // Add the hotspot to the service
        this.hotspotInfoService.addHotspot(this.selectedPanorama.id, result);
        
        // Display it in the current scene
        this.hotspotInfoService.createInfoHotspotElement(result, this.currentScene);

        //Add to export template structure
        this.projectDataService.setExportInfospot(this.selectedPanorama.id, result);
      }
    });
  }

  // Export hotspots to JSON in the required APP_DATA format
  exportHotspots() : void {

    // Get the current project data
    const projectData = this.projectDataService.projectData;

    const normalizeScene = (scene: any) => ({
      id: scene.id ?? '',
      name: scene.name ?? '',
      faceSize: scene.faceSize ?? 1500,
      initialViewParameters: scene.initialViewParameters ?? { yaw: 0, pitch: 0, fov: 1.5707963267948966 },
      linkHotspots: scene.linkHotspots ?? [],
      infoHotspots: scene.infoHotspots ?? []
    });
  
    // Ensure every scene follows the defined shape
    const scenes = (projectData.scenes || []).map(normalizeScene);

    const exportData = {
      scenes,
      name: projectData.name ?? '',
      settings: projectData.settings ?? {},
    };

    const dataJsContent = 'var APP_DATA = ' + JSON.stringify(exportData, null, 2) + ';\n';
    const templateBasePath = 'assets/export-templates';
    const zip = new JSZip();
    
    fetch(`${templateBasePath}/file-list.json`)
    .then(res => res.json())
    .then(filesList => {
      // Fetch all template files as before
      return Promise.all(
        filesList.map(async (path: string) => {
          const res = await fetch(`${templateBasePath}/${path}`);
          if (!res.ok) throw new Error(`Failed to load ${path}`);
          let content: Blob | string;
          if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg')) {
            content = await res.blob();
          } else {
            content = await res.text();
          }
          return { path, content };
        })
      );
    })
    .then(async files => {
      // Add template files to zip
      files.forEach(({ path, content }) => {
        if (path === 'data.js') {
          zip.file(path, dataJsContent); // replace with generated file
        } else {
          zip.file(path, content);
        }
      });

      // Add panorama images to useruploads folder in zip
      const panoramaBlobs = await Promise.all(
        this.panoramas.map(async pano => {
          // Fetch the blob from the object URL
          const response = await fetch(pano.url);
          const blob = await response.blob();
          return { name: pano.name, blob };
        })
      );
      panoramaBlobs.forEach(({ name, blob }) => {
        zip.file(`useruploads/${name}`, blob);
      });

      zip.generateAsync({ type: 'blob' }).then((blob: Blob) => {
        saveAs(blob, 'export-templates.zip');
      });
    })
    .catch(err => console.error('Error creating zip:', err));



    // Create a download link
    // const blob = new Blob([
    //   'var APP_DATA = ',
    //   JSON.stringify(exportData, null, 2),
    //   ';\n'
    // ], { type: 'application/javascript' });


    // const url = URL.createObjectURL(blob);
    // const a = document.createElement('a');
    // a.href = url;
    // a.download = 'data.js';
    // document.body.appendChild(a);
    // a.click();
    // document.body.removeChild(a);
    // URL.revokeObjectURL(url);
  }

  // Import hotspots from JSON file
  // importHotspots(event: any) {
  //   const file = event.target.files[0];
  //   if (!file) return;
    
  //   const reader = new FileReader();
  //   reader.onload = (e: any) => {
  //     try {
  //       const jsonData = e.target.result;
  //       this.hotspotInfoService.importHotspotsData(jsonData);
        
  //       // Reload hotspots for the current scene
  //       if (this.selectedPanorama) {
  //         this.loadHotspotsForScene(this.selectedPanorama.id);
  //       }
  //     } catch (error) {
  //       console.error('Error importing hotspots:', error);
  //     }
  //   };
  //   reader.readAsText(file);
  // }

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
      this.projectDataService.setAutorotateEnabled(Number(this.selectedPanorama?.id), true);
    } else {
      this.viewer.stopMovement();
      this.projectDataService.setAutorotateEnabled(Number(this.selectedPanorama?.id), false);
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
        // fov: hotspot.fov,
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
      pitch: view.pitch(),
      fov: view.fov()
    };
    
    this.projectDataService.setInitialView(this.selectedPanorama.id, initialView);

    // Save this as the initial view for this panorama
    this.panoramaService.setInitialViewForPanorama(this.selectedPanorama.id, initialView);
    
    // Show message using the message service instead of alert
    this.messageService.success(`Initial view set for ${this.selectedPanorama.name}`);
  }

  saveProjectTitle() {
    this.editingTitle = false;
    this.projectDataService.setName(this.projectTitle);
  }

  nextInstructionStep() {
    if (this.currentInstructionStep < this.instructionSteps.length - 1) {
      this.currentInstructionStep++;
    }
  }

  prevInstructionStep() {
    if (this.currentInstructionStep > 0) {
      this.currentInstructionStep--;
    }
  }

  closeInstructions() {
    this.showInstructions = false;
  }
}
