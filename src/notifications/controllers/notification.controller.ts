import { Controller, Post, Get, Body, Param, ValidationPipe, HttpCode } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { Notification } from '../entities/notification.entity';
import { NotificationStatusResponse } from '../interfaces/notification.interface';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @HttpCode(201)
  async create(@Body(ValidationPipe) dto: CreateNotificationDto): Promise<Notification> {
    return this.notificationService.create(dto);
  }

  @Get(':id/status')
  async getStatus(@Param('id') id: string): Promise<NotificationStatusResponse> {
    return this.notificationService.getStatus(id);
  }
}
