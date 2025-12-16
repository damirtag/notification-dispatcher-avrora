import { NotificationType } from '../entities/notification.entity';

export interface NotificationEvent {
  notificationId: string;
  userId: string;
  type: NotificationType;
  message: string;
  retryCount: number;
}

export interface NotificationStatusResponse {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  status: string;
  retryCount: number;
  createdAt: Date;
}
