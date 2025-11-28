import { Request, Response, NextFunction } from 'express';
import { CompanyService } from '../services/CompanyService';
import { asyncHandler } from '../middlewares/errorHandler';

export class CompanyController {
  private companyService = new CompanyService();

  getAll = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;

      const result = await this.companyService.getAll(page, limit);

      res.json({
        success: true,
        data: result,
      });
    }
  );

  getById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const company = await this.companyService.getById(id);

      res.json({
        success: true,
        data: { company },
      });
    }
  );

  create = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const company = await this.companyService.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Company created successfully',
        data: { company },
      });
    }
  );

  update = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const company = await this.companyService.update(id, req.body);

      res.json({
        success: true,
        message: 'Company updated successfully',
        data: { company },
      });
    }
  );

  delete = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      await this.companyService.delete(id);

      res.json({
        success: true,
        message: 'Company deleted successfully',
      });
    }
  );
}
