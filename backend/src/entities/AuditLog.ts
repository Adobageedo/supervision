import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  ARCHIVE = 'archive',
  RESTORE = 'restore',
}

export enum AuditEntity {
  INTERVENTION = 'intervention',
  USER = 'user',
  PREDEFINED_VALUE = 'predefined_value',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: AuditEntity,
  })
  @Index()
  entityType!: AuditEntity;

  @Column()
  @Index()
  entityId!: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  @Index()
  action!: AuditAction;

  @Column({ type: 'jsonb', nullable: true })
  oldValues?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValues?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 45, nullable: true })
  ipAddress?: string;

  @Column({ length: 255, nullable: true })
  userAgent?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ nullable: true })
  userId?: string;

  @CreateDateColumn()
  @Index()
  createdAt!: Date;
}
