import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { asyncHandler } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import { UserRole } from '../entities/User';

export class AuthController {
  private authService = new AuthService();

  register = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { email, password, firstName, lastName, role } = req.body;

      const result = await this.authService.register(
        email,
        password,
        firstName,
        lastName,
        role || UserRole.READ
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    }
  );

  login = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { email, password } = req.body;

      const result = await this.authService.login(email, password);

      res.json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    }
  );

  refreshToken = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { refreshToken } = req.body;

      const accessToken = await this.authService.refreshAccessToken(refreshToken);

      res.json({
        success: true,
        data: { accessToken },
      });
    }
  );

  logout = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const userId = req.user!.id;

      await this.authService.logout(userId);

      res.json({
        success: true,
        message: 'Logout successful',
      });
    }
  );

  getProfile = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      res.json({
        success: true,
        data: { user: req.user },
      });
    }
  );

  getAllUsers = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const users = await this.authService.getAllUsers();

      res.json({
        success: true,
        data: { users },
      });
    }
  );

  updateUserRole = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId } = req.params;
      const { role } = req.body;

      const user = await this.authService.updateUserRole(userId, role);

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: { user },
      });
    }
  );

  deactivateUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId } = req.params;

      await this.authService.deactivateUser(userId);

      res.json({
        success: true,
        message: 'User deactivated successfully',
      });
    }
  );
}
