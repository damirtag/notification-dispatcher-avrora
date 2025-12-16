import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { AckPolicy } from 'nats';
import { NatsService } from '../nats/nats.service';
import { RedisService } from '../redis/redis.service';
import { NotificationService } from '../notifications/services/notification.service';
import { NotificationEvent } from '../notifications/interfaces/notification.interface';
import {
  NotificationStatus,
  NotificationType,
} from '../notifications/entities/notification.entity';

@Injectable()
export class NotificationWorker implements OnModuleInit {
  private readonly logger = new Logger(NotificationWorker.name);
  private readonly MAX_RETRIES = 3;

  constructor(
    private readonly natsService: NatsService,
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.startConsumer();
  }

  private async startConsumer(): Promise<void> {
    const js = this.natsService.getJetStream();
    const jsm = this.natsService.getJetStreamManager();
    const codec = this.natsService.getCodec();

    let consumer;

    try {
      consumer = await js.consumers.get('NOTIFICATIONS', 'notification-worker');
    } catch {
      await jsm.consumers.add('NOTIFICATIONS', {
        durable_name: 'notification-worker',
        ack_policy: AckPolicy.Explicit,
        filter_subject: 'notifications',
        max_deliver: this.MAX_RETRIES + 1,
      });

      consumer = await js.consumers.get('NOTIFICATIONS', 'notification-worker');
    }

    const messages = await consumer.consume();
    this.logger.log('Worker started consuming notifications');

    for await (const msg of messages) {
      try {
        const event: NotificationEvent = JSON.parse(codec.decode(msg.data));
        await this.processNotification(event);
        msg.ack();
      } catch (error) {
        this.logger.error(`Error in consumer: ${error.message}`);
        msg.nak();
      }
    }
  }

  private async processNotification(event: NotificationEvent): Promise<void> {
    const { notificationId, userId, type } = event;

    this.logger.log(`Processing notification ${notificationId} for user ${userId} (${type})`);

    await this.notificationService.updateStatus(notificationId, NotificationStatus.PROCESSING);

    try {
      await this.simulateDelivery(type);

      await this.redisService.setAck(notificationId);
      this.logger.log(`Notification ${notificationId} delivered successfully`);

      await this.notificationService.updateStatus(notificationId, NotificationStatus.DELIVERED);
    } catch (error) {
      this.logger.error(`Delivery failed for ${notificationId}: ${error.message}`);
      await this.handleDeliveryFailure(notificationId, type);
    }
  }

  private async simulateDelivery(type: string): Promise<void> {
    const delay = type === 'email' ? 2000 : 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    if (Math.random() < 0.1) {
      throw new Error('Simulated delivery failure');
    }
  }

  private async handleDeliveryFailure(
    notificationId: string,
    type: NotificationType,
  ): Promise<void> {
    const retryCount = await this.notificationService.getRetryCount(notificationId);

    await this.notificationService.updateStatus(notificationId, NotificationStatus.PENDING, true);

    if (retryCount + 1 >= this.MAX_RETRIES) {
      this.logger.warn(`Notification ${notificationId} reached max retries, marking as failed`);
      await this.notificationService.updateStatus(notificationId, NotificationStatus.FAILED);
    } else {
      this.logger.log(
        `Notification ${notificationId} will be retried (attempt ${retryCount + 2}/${this.MAX_RETRIES})`,
      );

      const event: NotificationEvent = {
        notificationId,
        userId: '',
        type: type,
        message: '',
        retryCount: retryCount + 1,
      };

      await new Promise((resolve) => setTimeout(resolve, 5000));
      await this.natsService.publish('notifications', event);
    }
  }
}
