import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { CompanyController } from '../controllers/CompanyController';
import { authenticateToken as authenticate } from '../middlewares/auth';
import { validateRequest as validate } from '../middlewares/validation';

const router = Router();
const controller = new CompanyController();

// Get all companies with pagination
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

// Get company by ID
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  validate,
  controller.getById.bind(controller)
);

// Create company
router.post(
  '/',
  authenticate,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('isActive').optional().isBoolean()
  ],
  validate,
  controller.create.bind(controller)
);

// Update company
router.put(
  '/:id',
  authenticate,
  [
    param('id').isUUID(),
    body('name').optional().trim().notEmpty(),
    body('isActive').optional().isBoolean()
  ],
  validate,
  controller.update.bind(controller)
);

// Delete company
router.delete(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  validate,
  controller.delete.bind(controller)
);

export default router;
