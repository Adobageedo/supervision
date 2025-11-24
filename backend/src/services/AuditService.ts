import { AppDataSource } from '../config/database';
import { AuditLog, AuditAction, AuditEntity } from '../entities/AuditLog';

export interface AuditLogData {
  entityType: AuditEntity;
  entityId: string;
  action: AuditAction;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  userId?: string;
}

export class AuditService {
  private auditLogRepository = AppDataSource.getRepository(AuditLog);

  async log(data: AuditLogData): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(data);
    return await this.auditLogRepository.save(auditLog);
  }

  async getAuditLogs(
    filters: {
      entityType?: AuditEntity;
      entityId?: string;
      action?: AuditAction;
      userId?: string;
      fromDate?: Date;
      toDate?: Date;
    } = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user');

    if (filters.entityType) {
      queryBuilder.andWhere('audit.entityType = :entityType', {
        entityType: filters.entityType,
      });
    }

    if (filters.entityId) {
      queryBuilder.andWhere('audit.entityId = :entityId', {
        entityId: filters.entityId,
      });
    }

    if (filters.action) {
      queryBuilder.andWhere('audit.action = :action', { action: filters.action });
    }

    if (filters.userId) {
      queryBuilder.andWhere('audit.userId = :userId', { userId: filters.userId });
    }

    if (filters.fromDate) {
      queryBuilder.andWhere('audit.createdAt >= :fromDate', {
        fromDate: filters.fromDate,
      });
    }

    if (filters.toDate) {
      queryBuilder.andWhere('audit.createdAt <= :toDate', { toDate: filters.toDate });
    }

    const skip = (page - 1) * limit;
    queryBuilder.orderBy('audit.createdAt', 'DESC').skip(skip).take(limit);

    const [logs, total] = await queryBuilder.getManyAndCount();

    return { logs, total };
  }

  async getAuditLogsByEntityId(entityId: string): Promise<AuditLog[]> {
    return await this.auditLogRepository.find({
      where: { entityId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}
