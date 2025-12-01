import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken, authorizeRoles } from '../middlewares/auth';
import { authLimiter } from '../middlewares/rateLimiter';
import { body } from 'express-validator';
import { validateRequest } from '../middlewares/validation';
import { UserRole } from '../entities/User';

const router = Router();
const authController = new AuthController();

// Validation schemas for Firebase auth
const loginValidation = [
  body('idToken').notEmpty().withMessage('Firebase ID token is required'),
  validateRequest,
];

// Routes publiques - Firebase authentication
// Login receives Firebase ID token and returns user data from our DB
router.post('/login', authLimiter, loginValidation, authController.login);

// Routes protégées
router.post('/logout', authenticateToken, authController.logout);
router.get('/profile', authenticateToken, authController.getProfile);

// Routes admin uniquement
router.get(
  '/users',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN),
  authController.getAllUsers
);

router.put(
  '/users/:userId/role',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN),
  [body('role').isIn(Object.values(UserRole)).withMessage('Invalid role'), validateRequest],
  authController.updateUserRole
);

router.delete(
  '/users/:userId',
  authenticateToken,
  authorizeRoles(UserRole.ADMIN),
  authController.deactivateUser
);

export default router;
