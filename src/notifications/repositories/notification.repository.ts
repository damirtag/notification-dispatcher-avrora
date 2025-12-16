import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus } from '../entities/notification.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repository: Repository<Notification>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.repository.create({
      userId: dto.userId,
      type: dto.type,
      message: dto.message,
      status: NotificationStatus.PENDING,
      retryCount: 0,
    });
    return this.repository.save(notification);
  }

  async findById(id: string): Promise<Notification | null> {
    return this.repository.findOne({ where: { id } });
  }

  async updateStatus(
    id: string,
    status: NotificationStatus,
    incrementRetry = false,
  ): Promise<void> {
    const updateData: Partial<Notification> = { status };

    if (incrementRetry) {
      await this.repository.increment({ id }, 'retryCount', 1);
    }

    await this.repository.update(id, updateData);
  }

  async getRetryCount(id: string): Promise<number> {
    const notification = await this.repository.findOne({
      where: { id },
      select: ['retryCount'],
    });
    return notification?.retryCount || 0;
  }
}
