import { Router } from 'express';
import { InterventionController } from '../controllers/InterventionController';
import { authenticateToken, authorizeRoles } from '../middlewares/auth';
import { body } from 'express-validator';
import { validateRequest } from '../middlewares/validation';
import { UserRole } from '../entities/User';

const router = Router();
const interventionController = new InterventionController();

// Validation schemas
const createInterventionValidation = [
  body('titre').notEmpty().withMessage('Title is required'),
  body('centrale').notEmpty().withMessage('Central is required'),
  body('equipement').notEmpty().withMessage('Equipment is required'),
  body('typeEvenement').notEmpty().withMessage('Event type is required'),
  body('typeDysfonctionnement')
    .notEmpty()
    .withMessage('Malfunction type is required'),
  body('dateDebut').isISO8601().withMessage('Valid start date is required'),
  body('dateFin').optional().isISO8601().withMessage('Valid end date required'),
  body('dateIndisponibiliteDebut')
    .optional()
    .isISO8601()
    .withMessage('Valid unavailability start date required'),
  body('dateIndisponibiliteFin')
    .optional()
    .isISO8601()
    .withMessage('Valid unavailability end date required'),
  body('perteProduction')
    .optional()
    .isNumeric()
    .withMessage('Production loss must be numeric'),
  body('perteCommunication')
    .optional()
    .isNumeric()
    .withMessage('Communication loss must be numeric'),
  validateRequest,
];

// Routes publiques (lecture seule)
router.get('/', authenticateToken, interventionController.getInterventions);
router.get('/stats', authenticateToken, interventionController.getStats);
router.get('/export/csv', authenticateToken, interventionController.exportToCSV);
router.get('/:id', authenticateToken, interventionController.getInterventionById);

// Routes nécessitant les droits d'écriture
router.post(
  '/',
  authenticateToken,
  authorizeRoles(UserRole.WRITE, UserRole.ADMIN),
  createInterventionValidation,
  interventionController.createIntervention
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles(UserRole.WRITE, UserRole.ADMIN),
  interventionController.updateIntervention
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles(UserRole.WRITE, UserRole.ADMIN),
  interventionController.deleteIntervention
);

router.post(
  '/:id/archive',
  authenticateToken,
  authorizeRoles(UserRole.WRITE, UserRole.ADMIN),
  interventionController.archiveIntervention
);

router.post(
  '/:id/restore',
  authenticateToken,
  authorizeRoles(UserRole.WRITE, UserRole.ADMIN),
  interventionController.restoreIntervention
);

export default router;
