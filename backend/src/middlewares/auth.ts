import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { verifyFirebaseToken } from '../config/firebase';

export interface AuthRequest extends Request {
  user?: User;
  firebaseUid?: string;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if authentication is required
    const requireAuth = process.env.REQUIRE_AUTH !== 'false';

    if (!requireAuth) {
      // No auth mode - create a mock admin user
      const userRepository = AppDataSource.getRepository(User);
      let user = await userRepository.findOne({
        where: { email: 'no-auth@supervision.local' },
      });

      if (!user) {
        user = userRepository.create({
          email: 'no-auth@supervision.local',
          password: 'no-auth',
          firstName: 'No Auth',
          lastName: 'Mode',
          role: UserRole.ADMIN,
          firebaseUid: null,
        });
        await userRepository.save(user);
        console.log('✅ Created no-auth mode user');
      }

      req.user = user;
      return next();
    }

    // Normal Firebase authentication
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Access token missing', 401);
    }

    // Verify Firebase ID token
    const decodedToken = await verifyFirebaseToken(token);
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      throw new AppError('Email not found in token', 401);
    }

    // Find user in our database by email (linked to Firebase)
    const userRepository = AppDataSource.getRepository(User);
    let user = await userRepository.findOne({
      where: { email: email.toLowerCase(), isActive: true },
    });

    // If user doesn't exist in our DB, create them with default role
    if (!user) {
      user = userRepository.create({
        email: email.toLowerCase(),
        password: 'firebase-auth', // Placeholder - not used with Firebase
        firstName: decodedToken.name?.split(' ')[0] || 'User',
        lastName: decodedToken.name?.split(' ').slice(1).join(' ') || '',
        role: UserRole.READ, // Default role for new users
        firebaseUid: firebaseUid,
      });
      await userRepository.save(user);
      console.log(`✅ Created new user from Firebase: ${email}`);
    } else if (!user.firebaseUid) {
      // Link existing user to Firebase
      user.firebaseUid = firebaseUid;
      await userRepository.save(user);
      console.log(`✅ Linked existing user to Firebase: ${email}`);
    }

    req.user = user;
    req.firebaseUid = firebaseUid;
    next();
  } catch (error: any) {
    if (error.message === 'Invalid Firebase token') {
      next(new AppError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Role ${req.user.role} is not allowed to access this resource`,
          403
        )
      );
    }

    next();
  };
};
