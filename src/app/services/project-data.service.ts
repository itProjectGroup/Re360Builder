import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProjectData, Scene } from '../models/data';
import { PanoramaImage } from './panorama-builder/panorama.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectDataService {
  private initialData: ProjectData = {
    scenes: [],
    name: 'Project 1',  //Provide option to rename project
    settings: {
      mouseViewMode: 'drag',
      autorotateEnabled: true,
      fullscreenButton: false,
      viewControlButtons: false
    }
  };

  private projectDataSubject = new BehaviorSubject<ProjectData>({ ...this.initialData });
  projectData$ = this.projectDataSubject.asObservable();

  // Get current value
  get projectData(): ProjectData {
    return this.projectDataSubject.value;
  }

  // Reset for new session
  initializeProjectData() {
    this.projectDataSubject.next({ ...this.initialData });
  }

  addNewScene(panorama: PanoramaImage) {
    var scene: Scene = {
      id: panorama.id,
      name: panorama.name,
    }
    this.projectDataSubject.next({ ...this.initialData, scenes: [...this.projectData.scenes, scene] });
    console.log(this.projectData);
  }

  setName(name: string) {
    this.projectDataSubject.next({
      ...this.projectData,
      name
    });
  }

  setMouseViewMode(mode: string) {
    this.projectDataSubject.next({
      ...this.projectData,
      settings: {
        ...this.projectData.settings,
        mouseViewMode: mode
      }
    });
  }

  setAutorotateEnabled(panoramaId: number, enabled: boolean) {
    this.projectDataSubject.next({
      ...this.projectData,
      settings: {
        ...this.projectData.settings,
        autorotateEnabled: enabled
      }
    });
  }

  // Add or update a scene
  upsertScene(scene: Scene) {
    const scenes = [...this.projectData.scenes];
    const idx = scenes.findIndex(s => s.id === scene.id);
    if (idx > -1) {
      scenes[idx] = scene;
    } else {
      scenes.push(scene);
    }
    this.projectDataSubject.next({
      ...this.projectData,
      scenes
    });
  }

  // Optionally: remove a scene
  removeScene(sceneId: string) {
    const scenes = this.projectData.scenes.filter(s => s.id !== sceneId);
    this.projectDataSubject.next({
      ...this.projectData,
      scenes
    });
  }

  // Update the faceSize for a specific scene
  updateSceneFaceSize(sceneId: string, faceSize: number) {
    const scenes = this.projectData.scenes.map(scene =>
      scene.id === sceneId ? { ...scene, faceSize } : scene
    );
    this.projectDataSubject.next({
      ...this.projectData,
      scenes
    });
  }

  setInitialView(panoramaId: string, initialViewParameters: { yaw: number, pitch: number, fov: number }) {
    const scenes = this.projectData.scenes.map(scene =>
      scene.id === panoramaId ? { ...scene, initialViewParameters } : scene
    );
    this.projectDataSubject.next({
      ...this.projectData,
      scenes
    });
  }

  setExportInfospot(sceneId: string, infospot: { yaw: number; pitch: number; title: string; text: string }) {
    const updatedScenes = this.projectData.scenes.map(scene => {
      if (scene.id === sceneId) {
        const updatedInfoHotspots = Array.isArray(scene.infoHotspots)
          ? [...scene.infoHotspots, infospot]
          : [infospot];
  
        return {
          ...scene,
          infoHotspots: updatedInfoHotspots
        };
      }
      return scene;
    });
  
    this.projectDataSubject.next({
      ...this.projectData,
      scenes: updatedScenes
    });
  }

  setExportHotspot(sceneId: string, hotspot: { yaw: number; pitch: number; rotation: number; target: string }) {
    const updatedScenes = this.projectData.scenes.map(scene => {
      if (scene.id === sceneId) {
        const linkHotspots = Array.isArray(scene.linkHotspots)
          ? [...scene.linkHotspots, hotspot]
          : [hotspot];
        return { ...scene, linkHotspots };
      }
      return scene;
    });
  
    this.projectDataSubject.next({
      ...this.projectData,
      scenes: updatedScenes
    });
  }
  
}