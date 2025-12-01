import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { AppError } from '../middlewares/errorHandler';
import { firebaseAuth } from '../config/firebase';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  // Get or create user from Firebase authentication
  async getOrCreateUserFromFirebase(
    firebaseUid: string,
    email: string,
    displayName?: string
  ): Promise<User> {
    // First try to find by firebaseUid
    let user = await this.userRepository.findOne({
      where: { firebaseUid },
    });

    if (user) {
      // Update last login
      user.lastLogin = new Date();
      await this.userRepository.save(user);
      return user;
    }

    // Try to find by email (for linking existing accounts)
    user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (user) {
      // Link existing user to Firebase
      user.firebaseUid = firebaseUid;
      user.lastLogin = new Date();
      await this.userRepository.save(user);
      console.log(`✅ Linked existing user to Firebase: ${email}`);
      return user;
    }

    // Create new user
    const nameParts = displayName?.split(' ') || ['User', ''];
    user = this.userRepository.create({
      email: email.toLowerCase(),
      password: 'firebase-auth', // Placeholder - not used with Firebase
      firstName: nameParts[0] || 'User',
      lastName: nameParts.slice(1).join(' ') || '',
      role: UserRole.READ, // Default role for new users
      firebaseUid,
      lastLogin: new Date(),
    });

    await this.userRepository.save(user);
    console.log(`✅ Created new user from Firebase: ${email}`);
    return user;
  }

  // Verify Firebase token and return user data
  async verifyAndGetUser(idToken: string): Promise<{ user: User }> {
    try {
      const decodedToken = await firebaseAuth.verifyIdToken(idToken);
      
      if (!decodedToken.email) {
        throw new AppError('Email not found in Firebase token', 401);
      }

      const user = await this.getOrCreateUserFromFirebase(
        decodedToken.uid,
        decodedToken.email,
        decodedToken.name
      );

      if (!user.isActive) {
        throw new AppError('Account is deactivated', 403);
      }

      return { user };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Invalid Firebase token', 401);
    }
  }

  // Legacy login method - now just verifies Firebase token
  async login(idToken: string): Promise<{ user: User }> {
    return this.verifyAndGetUser(idToken);
  }

  async logout(userId: string): Promise<void> {
    // With Firebase, logout is handled client-side
    // We can optionally revoke refresh tokens server-side
    const user = await this.getUserById(userId);
    if (user.firebaseUid) {
      try {
        await firebaseAuth.revokeRefreshTokens(user.firebaseUid);
      } catch (error) {
        console.warn('Could not revoke Firebase tokens:', error);
      }
    }
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { firebaseUid } });
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const user = await this.getUserById(userId);
    user.role = role;
    return await this.userRepository.save(user);
  }

  async deactivateUser(userId: string): Promise<void> {
    const user = await this.getUserById(userId);
    user.isActive = false;
    await this.userRepository.save(user);
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  // Set custom claims for a user (e.g., role)
  async setUserClaims(firebaseUid: string, claims: { role: string }): Promise<void> {
    try {
      await firebaseAuth.setCustomUserClaims(firebaseUid, claims);
    } catch (error) {
      console.error('Error setting custom claims:', error);
    }
  }
}
