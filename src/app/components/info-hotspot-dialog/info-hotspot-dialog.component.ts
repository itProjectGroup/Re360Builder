import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Hotspot } from '../../services/hotspot/hotspot-info.service';

export interface InfoHotspotDialogData {
  yaw: number;
  pitch: number;
  hotspot?: Hotspot;
}

@Component({
  selector: 'app-info-hotspot-dialog',
  templateUrl: './info-hotspot-dialog.component.html',
  styleUrls: ['../shared/dialog-styles.scss']
})
export class InfoHotspotDialogComponent implements OnInit {
  title: string = '';
  text: string = '';
  isEditing: boolean = false;
  
  constructor(
    public dialogRef: MatDialogRef<InfoHotspotDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InfoHotspotDialogData
  ) {}
  
  ngOnInit(): void {
    // Check if we're editing an existing hotspot
    if (this.data.hotspot) {
      this.isEditing = true;
      this.title = this.data.hotspot.title || '';
      this.text = this.data.hotspot.text || '';
    }
  }
  
  onCancel(): void {
    this.dialogRef.close();
  }
  
  onSave(): void {
    if (!this.title || !this.text) {
      return;
    }
    
    const hotspot: Hotspot = {
      id: `info-${Date.now()}`,
      type: 'info',
      yaw: this.data.yaw,
      pitch: this.data.pitch,
      title: this.title,
      text: this.text,
      //rotation: 0
    };
    
    this.dialogRef.close(hotspot);
  }
} 