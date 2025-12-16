import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { Notification } from './entities/notification.entity';
import { RedisModule } from '../redis/redis.module';
import { NatsModule } from '../nats/nats.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), RedisModule, NatsModule],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}
