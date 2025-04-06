import { Component, OnInit } from '@angular/core';
import { MessageService } from '../../services/message/message.service';

@Component({
  selector: 'app-message-popup',
  templateUrl: './message-popup.component.html',
  styleUrls: ['./message-popup.component.scss']
})
export class MessagePopupComponent implements OnInit {
  messages: {type: string, text: string, visible: boolean}[] = [];
  
  constructor(private messageService: MessageService) {}
  
  ngOnInit(): void {
    this.messageService.message$.subscribe(message => {
      const newMessage = {...message, visible: true};
      this.messages.push(newMessage);
      
      setTimeout(() => {
        newMessage.visible = false;
        setTimeout(() => {
          this.messages = this.messages.filter(m => m !== newMessage);
        }, 300);
      }, 3000);
    });
  }

  removeMessage(message: {type: string, text: string, visible: boolean}): void {
    message.visible = false;
    
    setTimeout(() => {
      this.messages = this.messages.filter(m => m !== message);
    }, 300);
  }
} 