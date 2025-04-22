import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Hotspot } from '../../services/hotspot/hotspot-info.service';
import { PanoramaImage } from '../../services/panorama-builder/panorama.service';

export interface LinkHotspotDialogData {
  panoramas: PanoramaImage[];
  currentPanoramaId: string;
  yaw: number;
  pitch: number;
  currentView?: { yaw: number, pitch: number };
  hotspot?: Hotspot;
}

@Component({
  selector: 'app-link-hotspot-dialog',
  templateUrl: './link-hotspot-dialog.component.html',
  styleUrls: ['../shared/dialog-styles.scss']
})
export class LinkHotspotDialogComponent implements OnInit {
  selectedTargetId: string = '';
  isEditing: boolean = false;
  initialViewYaw: number = 0;
  initialViewPitch: number = 0;
  
  constructor(
    public dialogRef: MatDialogRef<LinkHotspotDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LinkHotspotDialogData
  ) {}
  
  ngOnInit(): void {
    // Check if we're editing an existing hotspot
    if (this.data.hotspot) {
      this.isEditing = true;
      this.selectedTargetId = this.data.hotspot.target || '';
      
      // Set initial view values if they exist
      if (this.data.hotspot.targetInitialView) {
        this.initialViewYaw = this.data.hotspot.targetInitialView.yaw;
        this.initialViewPitch = this.data.hotspot.targetInitialView.pitch;
      }
    }
  }
  
  onTargetChange(): void {
    // Reset initial view when target changes
    this.initialViewYaw = 0;
    this.initialViewPitch = 0;
  }
  
  useCurrentViewAsInitial(): void {
    if (this.data.currentView) {
      this.initialViewYaw = Math.round(this.data.currentView.yaw);
      this.initialViewPitch = Math.round(this.data.currentView.pitch);
    }
  }
  
  onCancel(): void {
    this.dialogRef.close();
  }
  
  onSave(): void {
    if (!this.selectedTargetId) return;
    
    const hotspot: Hotspot = {
      id: this.isEditing && this.data.hotspot ? this.data.hotspot.id : `link-${Date.now()}`,
      type: 'link',
      yaw: this.data.yaw,
      pitch: this.data.pitch,
      target: this.selectedTargetId
    };
    
    // Add initial view if values are set
    if (this.initialViewYaw !== 0 || this.initialViewPitch !== 0) {
      hotspot.targetInitialView = {
        yaw: this.initialViewYaw,
        pitch: this.initialViewPitch
      };
    }
    
    this.dialogRef.close(hotspot);
  }

  setPresetView(yaw: number, pitch: number): void {
    this.initialViewYaw = yaw;
    this.initialViewPitch = pitch;
  }

  useTargetInitialView(): void {
    if (!this.selectedTargetId) return;
    
    // Find the selected panorama
    const targetPanorama = this.data.panoramas.find(p => p.id === this.selectedTargetId);
    
    // If it has an initialView, use it
    if (targetPanorama?.initialView) {
      this.initialViewYaw = targetPanorama.initialView.yaw;
      this.initialViewPitch = targetPanorama.initialView.pitch;
    } else {
      // If no initial view exists for the target, show a message
      alert('No initial view has been set for this panorama.');
    }
  }
} 