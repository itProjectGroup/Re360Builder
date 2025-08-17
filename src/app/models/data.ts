export interface Scene {
  id: string;
  name: string;
  faceSize?: number; // Added to store the width of the panorama image
  initialViewParameters?: {
    yaw: number;
    pitch: number;
    fov: number;
  };
  linkHotspots?: Array<{
    yaw: number;
    pitch: number;
    rotation: number;
    target: string;
  }>;
  infoHotspots?: Array<{
    yaw: number;
    pitch: number;
    title: string;
    text: string;
  }>;
}

export interface ProjectData {
  scenes: Scene[];
  name: string;
  settings: {
    mouseViewMode: string;
    autorotateEnabled: boolean;
    fullscreenButton: boolean;
    viewControlButtons: boolean;
  };
}
