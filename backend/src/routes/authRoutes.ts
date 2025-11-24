import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken, authorizeRoles } from '../middlewares/auth';
import { authLimiter } from '../middlewares/rateLimiter';
import { body } from 'express-validator';
import { validateRequest } from '../middlewares/validation';
import { UserRole } from '../entities/User';

const router = Router();
const authController = new AuthController();

// Validation schemas
const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  validateRequest,
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest,
];

const refreshTokenValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  validateRequest,
];

// Routes publiques
router.post('/register', authLimiter, registerValidation, authController.register);
router.post('/login', authLimiter, loginValidation, authController.login);
router.post('/refresh', refreshTokenValidation, authController.refreshToken);

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
