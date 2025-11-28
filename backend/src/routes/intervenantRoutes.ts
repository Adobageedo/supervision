import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { IntervenantController } from '../controllers/IntervenantController';
import { authenticateToken as authenticate } from '../middlewares/auth';
import { validateRequest as validate } from '../middlewares/validation';

const router = Router();
const controller = new IntervenantController();

// Get all intervenants with pagination
router.get(
  '/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 1000 })
  ],
  validate,
  controller.getAll.bind(controller)
);

// Get intervenant by ID
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  validate,
  controller.getById.bind(controller)
);

// Create intervenant
router.post(
  '/',
  authenticate,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('surname').trim().notEmpty().withMessage('Surname is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('country').optional().trim(),
    body('companyId').optional().isUUID(),
    body('isActive').optional().isBoolean()
  ],
  validate,
  controller.create.bind(controller)
);

// Update intervenant
router.put(
  '/:id',
  authenticate,
  [
    param('id').isUUID(),
    body('name').optional().trim().notEmpty(),
    body('surname').optional().trim().notEmpty(),
    body('phone').optional().trim().notEmpty(),
    body('country').optional().trim(),
    body('companyId').optional().isUUID(),
    body('isActive').optional().isBoolean()
  ],
  validate,
  controller.update.bind(controller)
);

// Delete intervenant
router.delete(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  validate,
  controller.delete.bind(controller)
);

export default router;
