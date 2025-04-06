import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface PanoramaImage {
  id: string;
  name: string;
  url: string;
  initialView?: {
    yaw: number;
    pitch: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PanoramaService {
  private panoramasSubject = new BehaviorSubject<PanoramaImage[]>([]);
  panoramas$ = this.panoramasSubject.asObservable();

  addPanoramas(files: File[]) {
    const newPanoramas: PanoramaImage[] = [];
    
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      console.log('Created URL for file:', url);
      newPanoramas.push({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: url
      });
    });

    const currentPanoramas = this.panoramasSubject.getValue();
    this.panoramasSubject.next([...currentPanoramas, ...newPanoramas]);
  }

  setInitialViewForPanorama(panoramaId: string, initialView: { yaw: number, pitch: number }): void {
    const panoramas = [...this.panoramasSubject.value];
    const index = panoramas.findIndex(p => p.id === panoramaId);
    
    if (index !== -1) {
      panoramas[index] = {
        ...panoramas[index],
        initialView: initialView
      };
      
      this.panoramasSubject.next(panoramas);
    }
  }

  getInitialViewForPanorama(panoramaId: string): { yaw: number, pitch: number } | undefined {
    const panorama = this.panoramasSubject.value.find(p => p.id === panoramaId);
    return panorama?.initialView;
  }
}
