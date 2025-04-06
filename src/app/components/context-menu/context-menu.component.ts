import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-context-menu',
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.scss']
})
export class ContextMenuComponent {
  @Input() x = 0;
  @Input() y = 0;
  @Input() visible = false;
  
  @Output() addLinkHotspot = new EventEmitter<void>();
  @Output() addInfoHotspot = new EventEmitter<void>();
  @Output() setInitialView = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  
  constructor(private elementRef: ElementRef) {}
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close the context menu when clicking outside of it
    if (this.visible && !this.elementRef.nativeElement.contains(event.target)) {
      this.close.emit();
    }
  }
  
  onAddLinkHotspot(): void {
    this.addLinkHotspot.emit();
    this.close.emit();
  }
  
  onAddInfoHotspot(): void {
    this.addInfoHotspot.emit();
    this.close.emit();
  }
  
  onSetInitialView(): void {
    this.setInitialView.emit();
    this.close.emit();
  }
} 