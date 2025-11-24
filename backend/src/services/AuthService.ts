import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { AppError } from '../middlewares/errorHandler';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole = UserRole.READ
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
    });

    await this.userRepository.save(user);

    // Générer les tokens
    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Stocker le refresh token
    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.save(user);

    // Retourner sans le mot de passe
    delete (user as any).password;
    delete (user as any).refreshToken;

    return { user, accessToken, refreshToken };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    // Trouver l'utilisateur avec le mot de passe
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Générer les tokens
    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Mettre à jour le refresh token et lastLogin
    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    // Retourner sans le mot de passe
    delete (user as any).password;
    delete (user as any).refreshToken;

    return { user, accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!jwtRefreshSecret) {
      throw new AppError('JWT refresh secret not configured', 500);
    }

    try {
      const decoded = jwt.verify(refreshToken, jwtRefreshSecret) as { userId: string };

      const user = await this.userRepository
        .createQueryBuilder('user')
        .addSelect('user.refreshToken')
        .where('user.id = :id', { id: decoded.userId })
        .getOne();

      if (!user || !user.refreshToken) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Vérifier le refresh token stocké
      const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!isRefreshTokenValid) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Générer un nouveau access token
      return this.generateAccessToken(user.id);
    } catch (error) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.update({ id: userId }, { refreshToken: null });
  }

  private generateAccessToken(userId: string): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError('JWT secret not configured', 500);
    }

    const options: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN as any) || '15m' };
    return jwt.sign({ userId }, jwtSecret as Secret, options);
  }

  private generateRefreshToken(userId: string): string {
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!jwtRefreshSecret) {
      throw new AppError('JWT refresh secret not configured', 500);
    }

    const options: SignOptions = { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN as any) || '7d' };
    return jwt.sign({ userId }, jwtRefreshSecret as Secret, options);
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
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
}
