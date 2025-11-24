import { Router } from 'express';
import { AuditController } from '../controllers/AuditController';
import { authenticateToken, authorizeRoles } from '../middlewares/auth';
import { UserRole } from '../entities/User';

const router = Router();
const auditController = new AuditController();

// Routes admin uniquement
router.get(
  '/',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN),
  auditController.getAuditLogs
);

router.get(
  '/entity/:entityId',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN),
  auditController.getAuditLogsByEntity
);

export default router;
