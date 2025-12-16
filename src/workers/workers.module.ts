import { Module } from '@nestjs/common';
import { NotificationWorker } from './notification.worker';
import { NatsModule } from '../nats/nats.module';
import { RedisModule } from '../redis/redis.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NatsModule, RedisModule, NotificationsModule],
  providers: [NotificationWorker],
})
export class WorkersModule {}
