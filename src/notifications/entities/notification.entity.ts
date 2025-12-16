import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
}

export enum NotificationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar' })
  userId: string;

  @Column({
    type: 'varchar',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column('text')
  message: string;

  @Column({
    type: 'varchar',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ type: 'int', default: 0, name: 'retry_count' })
  retryCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
