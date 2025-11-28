import { Request, Response, NextFunction } from 'express';
import { IntervenantProfileService } from '../services/IntervenantProfileService';
import { asyncHandler } from '../middlewares/errorHandler';

export class IntervenantController {
  private intervenantService = new IntervenantProfileService();

  getAll = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;

      const result = await this.intervenantService.getAll(page, limit);

      res.json({
        success: true,
        data: result,
      });
    }
  );

  getById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const intervenant = await this.intervenantService.getById(id);

      res.json({
        success: true,
        data: { intervenant },
      });
    }
  );

  create = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const intervenant = await this.intervenantService.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Intervenant created successfully',
        data: { intervenant },
      });
    }
  );

  update = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const intervenant = await this.intervenantService.update(id, req.body);

      res.json({
        success: true,
        message: 'Intervenant updated successfully',
        data: { intervenant },
      });
    }
  );

  delete = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      await this.intervenantService.delete(id);

      res.json({
        success: true,
        message: 'Intervenant deleted successfully',
      });
    }
  );
}
