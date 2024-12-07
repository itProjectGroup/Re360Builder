declare module 'marzipano' {
  export class Viewer {
    constructor(element: HTMLElement, options?: any);
    createScene(options: any): Scene;
    destroyAllScenes(): void;
  }

  export class RectilinearView {
    static limit: {
      traditional(maxResolution: number, maxVFov: number): any;
    };
    constructor(params: any, limiter: any);
  }

  export class EquirectGeometry {
    constructor(levelPropertiesList: any[]);
  }

  export class ImageUrlSource {
    static fromString(url: string, options?: any): any;
  }

  export interface Scene {
    switchTo(options?: { transitionDuration: number }): void;
  }
}