import { Router } from 'express';
import { PredefinedValueController } from '../controllers/PredefinedValueController';
import { authenticateToken, authorizeRoles } from '../middlewares/auth';
import { body } from 'express-validator';
import { validateRequest } from '../middlewares/validation';
import { UserRole } from '../entities/User';
import { PredefinedType } from '../entities/PredefinedValue';

const router = Router();
const predefinedValueController = new PredefinedValueController();

// Validation schemas
const createValueValidation = [
  body('type')
    .isIn(Object.values(PredefinedType))
    .withMessage('Invalid predefined type'),
  body('value').notEmpty().withMessage('Value is required'),
  validateRequest,
];

// Routes accessibles à tous les utilisateurs authentifiés
router.get('/', authenticateToken, predefinedValueController.getAllValues);
router.get('/:type', authenticateToken, predefinedValueController.getValuesByType);

// Routes admin uniquement
router.post(
  '/',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN),
  createValueValidation,
  predefinedValueController.createValue
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN),
  predefinedValueController.updateValue
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN),
  predefinedValueController.deleteValue
);

router.post(
  '/:type/reorder',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN),
  [body('orderedIds').isArray().withMessage('Ordered IDs must be an array'), validateRequest],
  predefinedValueController.reorderValues
);

export default router;
