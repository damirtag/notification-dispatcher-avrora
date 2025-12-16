import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from './notifications/notifications.module';
import { RedisModule } from './redis/redis.module';
import { NatsModule } from './nats/nats.module';
import { WorkersModule } from './workers/workers.module';
import { Notification } from './notifications/entities/notification.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DATABASE_HOST', 'localhost'),
        port: config.get<number>('DATABASE_PORT', 5432),
        username: config.get<string>('DATABASE_USER', 'notifuser'),
        password: config.get<string>('DATABASE_PASSWORD', 'notifpass'),
        database: config.get<string>('DATABASE_NAME', 'notifdb'),
        entities: [Notification],
        synchronize: true,
        logging: true,
      }),
    }),
    NotificationsModule,
    RedisModule,
    NatsModule,
    WorkersModule,
  ],
})
export class AppModule {}
