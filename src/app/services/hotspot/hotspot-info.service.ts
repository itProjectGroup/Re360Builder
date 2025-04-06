import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export interface Hotspot {
  id: string;
  type: 'link' | 'info';
  yaw: number;
  pitch: number;
  target?: string; // For link hotspots
  targetInitialView?: { // Initial view when navigating to target
    yaw: number;
    pitch: number;
  };
  title?: string;  // For info hotspots
  text?: string;   // For info hotspots
}

export interface SceneHotspots {
  sceneId: string;
  hotspots: Hotspot[];
}

@Injectable({
  providedIn: 'root'
})
export class HotspotInfoService {
  private selectedHotspot?: Hotspot;
  private selectedHotspotElement?: HTMLElement;
  
  private hotspotsBySceneSubject = new BehaviorSubject<SceneHotspots[]>([]);
  hotspotsByScene$ = this.hotspotsBySceneSubject.asObservable();

  // Replace @Output decorators with Subject
  private editHotspotSubject = new Subject<Hotspot>();
  private deleteHotspotSubject = new Subject<Hotspot>();
  
  editHotspot$ = this.editHotspotSubject.asObservable();
  deleteHotspot$ = this.deleteHotspotSubject.asObservable();

  constructor() { }

  // Create a link hotspot element
  createLinkHotspotElement(hotspot: Hotspot, scene: any, onHotspotClick: (target: string) => void): void {
    // Create wrapper element to hold icon and tooltip
    const wrapper = document.createElement('div');
    wrapper.classList.add('hotspot', 'link-hotspot');
    wrapper.id = hotspot.id;

    // Create image element
    const icon = document.createElement('img');
    icon.src = './assets/img/link.png';
    icon.classList.add('link-hotspot-icon');
    icon.style.filter = 'invert(100%)'; // Make icon more visible
    wrapper.appendChild(icon);

    // Set the position of the hotspot
    const position = { yaw: hotspot.yaw, pitch: hotspot.pitch };
    scene.hotspotContainer().createHotspot(wrapper, position);

    // Add click event listener
    wrapper.addEventListener('click', (e) => {
      // Only navigate if directly clicking the icon
      if (e.target === icon && hotspot.target) {
        onHotspotClick(hotspot.target);
      }
    });

    // Stop propagation of touch and scroll events
    this.stopTouchAndScrollEventPropagation(wrapper);

    // Add tooltip if target exists
    if (hotspot.target) {
      const tooltip = document.createElement('div');
      tooltip.classList.add('hotspot-tooltip', 'link-hotspot-tooltip');
      tooltip.textContent = hotspot.target;
      wrapper.appendChild(tooltip);
    }

    // Add context menu for editing/deleting
    this.createHotspotContextMenu(hotspot, wrapper, scene);
  }

  // Create an info hotspot element
  createInfoHotspotElement(hotspot: Hotspot, scene: any): void {
    // Create wrapper element
    const wrapper = document.createElement('div');
    wrapper.classList.add('hotspot', 'info-hotspot');
    wrapper.id = hotspot.id;

    // Create header
    const header = document.createElement('div');
    header.classList.add('info-hotspot-header');
    
    // Create icon wrapper and icon
    const iconWrapper = document.createElement('div');
    iconWrapper.classList.add('info-hotspot-icon-wrapper');
    const icon = document.createElement('img');
    icon.src = './assets/img/info.png';
    icon.classList.add('info-hotspot-icon');
    iconWrapper.appendChild(icon);
    
    // Create title wrapper and title
    const titleWrapper = document.createElement('div');
    titleWrapper.classList.add('info-hotspot-title-wrapper');
    const title = document.createElement('div');
    title.classList.add('info-hotspot-title');
    title.textContent = hotspot.title || 'Information';
    titleWrapper.appendChild(title);
    
    // Create close button
    const closeWrapper = document.createElement('div');
    closeWrapper.classList.add('info-hotspot-close-wrapper');
    const closeIcon = document.createElement('img');
    closeIcon.src = './assets/img/close.png';
    closeIcon.classList.add('info-hotspot-close-icon');
    closeWrapper.appendChild(closeIcon);
    
    // Assemble header
    header.appendChild(iconWrapper);
    header.appendChild(titleWrapper);
    header.appendChild(closeWrapper);
    
    // Create text content
    const text = document.createElement('div');
    text.classList.add('info-hotspot-text');
    text.textContent = hotspot.text || 'No information provided';
    
    // Assemble hotspot
    wrapper.appendChild(header);
    wrapper.appendChild(text);
    
    // Create a modal for mobile view
    const modal = document.createElement('div');
    modal.innerHTML = wrapper.innerHTML;
    modal.classList.add('info-hotspot-modal');
    document.body.appendChild(modal);
    
    // Set up toggle functionality
    const toggle = () => {
      wrapper.classList.toggle('visible');
      modal.classList.toggle('visible');
    };
    
    // Set event handlers
    wrapper.querySelector('.info-hotspot-header')?.addEventListener('click', toggle);
    modal.querySelector('.info-hotspot-close-wrapper')?.addEventListener('click', toggle);
    
    // Stop propagation of events
    this.stopTouchAndScrollEventPropagation(wrapper);
    
    // Add to scene
    const position = { yaw: hotspot.yaw, pitch: hotspot.pitch };
    scene.hotspotContainer().createHotspot(wrapper, position);

    // Add context menu for editing/deleting
    this.createHotspotContextMenu(hotspot, wrapper, scene);
  }

  // Helper to prevent event propagation
  private stopTouchAndScrollEventPropagation(element: HTMLElement): void {
    const eventList = ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'wheel', 'mousewheel'];
    eventList.forEach(eventName => {
      element.addEventListener(eventName, (event) => {
        event.stopPropagation();
      });
    });
  }

  // Add a hotspot to a scene
  addHotspot(sceneId: string, hotspot: Hotspot): void {
    const currentHotspots = this.hotspotsBySceneSubject.getValue();
    const sceneIndex = currentHotspots.findIndex(s => s.sceneId === sceneId);
    
    // Generate a unique ID if not provided
    if (!hotspot.id) {
      hotspot.id = `hotspot-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    
    if (sceneIndex >= 0) {
      // Scene exists, add hotspot to it
      const updatedScenes = [...currentHotspots];
      updatedScenes[sceneIndex].hotspots.push(hotspot);
      this.hotspotsBySceneSubject.next(updatedScenes);
    } else {
      // Create new scene entry
      const newScene: SceneHotspots = {
        sceneId,
        hotspots: [hotspot]
      };
      this.hotspotsBySceneSubject.next([...currentHotspots, newScene]);
    }
  }

  // Remove a hotspot
  removeHotspot(sceneId: string, hotspotId: string): void {
    const currentHotspots = this.hotspotsBySceneSubject.getValue();
    const sceneIndex = currentHotspots.findIndex(s => s.sceneId === sceneId);
    
    if (sceneIndex >= 0) {
      const updatedScenes = [...currentHotspots];
      updatedScenes[sceneIndex].hotspots = updatedScenes[sceneIndex].hotspots
        .filter(h => h.id !== hotspotId);
      this.hotspotsBySceneSubject.next(updatedScenes);
    }
  }

  // Get all hotspots for a scene
  getHotspotsForScene(sceneId: string): Hotspot[] {
    const scenes = this.hotspotsBySceneSubject.getValue();
    const scene = scenes.find(s => s.sceneId === sceneId);
    return scene ? scene.hotspots : [];
  }

  // Export all hotspots data as JSON
  exportHotspotsData(): string {
    const data = this.hotspotsBySceneSubject.getValue();
    return JSON.stringify(data, null, 2);
  }

  // Import hotspots data from JSON
  importHotspotsData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData) as SceneHotspots[];
      this.hotspotsBySceneSubject.next(data);
    } catch (error) {
      console.error('Failed to import hotspots data:', error);
    }
  }

  // Add context menu for editing/deleting
  createHotspotContextMenu(hotspot: Hotspot, element: HTMLElement, scene: any): void {
    const contextMenu = document.createElement('div');
    contextMenu.classList.add('hotspot-context-menu');
    contextMenu.style.display = 'none';
    
    const editButton = document.createElement('button');
    editButton.innerText = 'Edit';
    editButton.classList.add('hotspot-button');
    editButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.editHotspotSubject.next(hotspot);
      contextMenu.style.display = 'none';
    });
    
    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Delete';
    deleteButton.classList.add('hotspot-button');
    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteHotspotSubject.next(hotspot);
      contextMenu.style.display = 'none';
    });
    
    contextMenu.appendChild(editButton);
    contextMenu.appendChild(deleteButton);
    element.appendChild(contextMenu);
    
    // Add click event to the hotspot element
    element.addEventListener('click', (e) => {
      e.stopPropagation();
      if (hotspot.type === 'link') {
        // For link hotspots, follow the link if clicked directly
        if (hotspot.target && e.target === element || e.target === element.querySelector('.link-hotspot-icon')) {
          // Let the link navigate
          return;
        }
      }
      
      // Otherwise, show the context menu
      this.selectHotspot(hotspot, element);
      contextMenu.style.display = 'block';
    });
    
    // Close context menu when clicking outside
    document.addEventListener('click', () => {
      if (contextMenu) {
        contextMenu.style.display = 'none';
      }
    });
  }

  selectHotspot(hotspot: Hotspot, element: HTMLElement): void {
    this.selectedHotspot = hotspot;
    this.selectedHotspotElement = element;
    this.editHotspotSubject.next(hotspot);  // Replace emit() with next()
  }
}
