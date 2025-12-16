import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus } from '../entities/notification.entity';
import { NatsService } from '../../nats/nats.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import {
  NotificationEvent,
  NotificationStatusResponse,
} from '../interfaces/notification.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly natsService: NatsService,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepo.create(dto);
    await this.notificationRepo.save(notification);
    this.logger.log(`Notification created: ${notification.id}`);

    const event: NotificationEvent = {
      notificationId: notification.id,
      userId: notification.userId,
      type: notification.type,
      message: notification.message,
      retryCount: 0,
    };

    await this.natsService.publish('notifications', event);
    this.logger.log(`Notification event published: ${notification.id}`);

    return notification;
  }

  async getStatus(id: string): Promise<NotificationStatusResponse> {
    const notification = await this.notificationRepo.findOne({ where: { id } });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      message: notification.message,
      status: notification.status,
      retryCount: notification.retryCount,
      createdAt: notification.createdAt,
    };
  }

  async updateStatus(
    id: string,
    status: NotificationStatus,
    incrementRetry = false,
  ): Promise<void> {
    const notification = await this.notificationRepo.findOne({ where: { id } });
    if (!notification) throw new NotFoundException(`Notification ${id} not found`);

    notification.status = status;
    if (incrementRetry) notification.retryCount += 1;

    await this.notificationRepo.save(notification);
    this.logger.log(`Notification ${id} status updated to ${status}`);
  }

  async getRetryCount(id: string): Promise<number> {
    const notification = await this.notificationRepo.findOne({ where: { id } });
    if (!notification) throw new NotFoundException(`Notification ${id} not found`);
    return notification.retryCount;
  }
}
