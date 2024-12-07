import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface PanoramaImage {
  id: string;
  name: string;
  url: string;
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
}
