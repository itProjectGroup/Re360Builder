import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Message {
  type: 'success' | 'error' | 'info';
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private messageSubject = new Subject<Message>();
  message$ = this.messageSubject.asObservable();

  success(text: string): void {
    this.messageSubject.next({ type: 'success', text });
  }

  error(text: string): void {
    this.messageSubject.next({ type: 'error', text });
  }

  info(text: string): void {
    this.messageSubject.next({ type: 'info', text });
  }
} 