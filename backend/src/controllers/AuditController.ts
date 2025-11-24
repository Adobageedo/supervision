import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/AuditService';
import { AuditEntity, AuditAction } from '../entities/AuditLog';
import { asyncHandler } from '../middlewares/errorHandler';

export class AuditController {
  private auditService = new AuditService();

  getAuditLogs = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        entityType,
        entityId,
        action,
        userId,
        fromDate,
        toDate,
        page = '1',
        limit = '50',
      } = req.query;

      const filters = {
        entityType: entityType as AuditEntity | undefined,
        entityId: entityId as string | undefined,
        action: action as AuditAction | undefined,
        userId: userId as string | undefined,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
      };

      const result = await this.auditService.getAuditLogs(
        filters,
        parseInt(page as string, 10),
        parseInt(limit as string, 10)
      );

      res.json({
        success: true,
        data: result,
      });
    }
  );

  getAuditLogsByEntity = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { entityId } = req.params;

      const logs = await this.auditService.getAuditLogsByEntityId(entityId);

      res.json({
        success: true,
        data: { logs },
      });
    }
  );
}
