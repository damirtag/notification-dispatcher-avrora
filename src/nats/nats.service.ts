import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  connect,
  NatsConnection,
  JetStreamClient,
  JetStreamManager,
  Codec,
  StringCodec,
  RetentionPolicy,
} from 'nats';
import { NotificationEvent } from '../notifications/interfaces/notification.interface';

@Injectable()
export class NatsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NatsService.name);
  private connection: NatsConnection;
  private jetstream: JetStreamClient;
  private jetstreamManager: JetStreamManager;
  private readonly codec: Codec<string> = StringCodec();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.configService.get<string>('NATS_URL', 'nats://localhost:4222');

    this.connection = await connect({ servers: url });
    this.logger.log('NATS connected');

    this.jetstream = this.connection.jetstream();
    this.jetstreamManager = await this.connection.jetstreamManager();

    await this.setupStreams();
  }

  async onModuleDestroy(): Promise<void> {
    await this.connection.drain();
    this.logger.log('NATS disconnected');
  }

  private async setupStreams(): Promise<void> {
    try {
      await this.jetstreamManager.streams.add({
        name: 'NOTIFICATIONS',
        subjects: ['notifications'],
        retention: RetentionPolicy.Limits,
        max_age: 86400000000000,
      });
      this.logger.log('JetStream stream created');
    } catch (err) {
      if (err.message?.includes('already in use')) {
        this.logger.log('JetStream stream already exists');
      } else {
        throw err;
      }
    }
  }

  async publish(subject: string, data: NotificationEvent): Promise<void> {
    await this.jetstream.publish(subject, this.codec.encode(JSON.stringify(data)));
  }

  getConnection(): NatsConnection {
    return this.connection;
  }

  getJetStream(): JetStreamClient {
    return this.jetstream;
  }

  getJetStreamManager(): JetStreamManager {
    return this.jetstreamManager;
  }

  getCodec(): Codec<string> {
    return this.codec;
  }
}
