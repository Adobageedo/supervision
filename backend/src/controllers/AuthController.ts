import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { asyncHandler } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import { UserRole } from '../entities/User';

export class AuthController {
  private authService = new AuthService();

  // Firebase login - receives Firebase ID token and returns user data
  login = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { idToken } = req.body;

      if (!idToken) {
        res.status(400).json({
          success: false,
          message: 'Firebase ID token is required',
        });
        return;
      }

      const result = await this.authService.login(idToken);

      res.json({
        success: true,
        message: 'Login successful',
        data: result,
      });

      return;
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
