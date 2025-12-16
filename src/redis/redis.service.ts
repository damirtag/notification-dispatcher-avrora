import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

    this.client = createClient({
      url: `redis://${host}:${port}`,
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error', err);
    });

    await this.client.connect();
    this.logger.log('Redis connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
    this.logger.log('Redis disconnected');
  }

  async setAck(notificationId: string): Promise<void> {
    const key = `notification:ack:${notificationId}`;
    await this.client.setEx(key, 300, 'delivered');
    this.logger.log(`ACK stored for notification: ${notificationId}`);
  }

  async hasAck(notificationId: string): Promise<boolean> {
    const key = `notification:ack:${notificationId}`;
    const value = await this.client.get(key);
    return value !== null;
  }

  async deleteAck(notificationId: string): Promise<void> {
    const key = `notification:ack:${notificationId}`;
    await this.client.del(key);
  }
}
