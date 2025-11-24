import { Request, Response, NextFunction } from 'express';
import { PredefinedValueService } from '../services/PredefinedValueService';
import { PredefinedType } from '../entities/PredefinedValue';
import { asyncHandler, AppError } from '../middlewares/errorHandler';

export class PredefinedValueController {
  private predefinedValueService = new PredefinedValueService();

  createValue = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { type, value, description } = req.body;

      const predefinedValue = await this.predefinedValueService.createValue(
        type as PredefinedType,
        value,
        description
      );

      res.status(201).json({
        success: true,
        message: 'Predefined value created successfully',
        data: { predefinedValue },
      });
    }
  );

  getValuesByType = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { type } = req.params;

      if (!Object.values(PredefinedType).includes(type as PredefinedType)) {
        throw new AppError('Invalid predefined type', 400);
      }

      const values = await this.predefinedValueService.getValuesByType(
        type as PredefinedType
      );

      res.json({
        success: true,
        data: { values },
      });
    }
  );

  getAllValues = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const values = await this.predefinedValueService.getAllValues();

      res.json({
        success: true,
        data: { values },
      });
    }
  );

  updateValue = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { value, description, isActive, sortOrder } = req.body;

      const predefinedValue = await this.predefinedValueService.updateValue(id, {
        value,
        description,
        isActive,
        sortOrder,
      });

      res.json({
        success: true,
        message: 'Predefined value updated successfully',
        data: { predefinedValue },
      });
    }
  );

  deleteValue = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      await this.predefinedValueService.deleteValue(id);

      res.json({
        success: true,
        message: 'Predefined value deleted successfully',
      });
    }
  );

  reorderValues = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { type } = req.params;
      const { orderedIds } = req.body;

      if (!Object.values(PredefinedType).includes(type as PredefinedType)) {
        throw new AppError('Invalid predefined type', 400);
      }

      await this.predefinedValueService.reorderValues(
        type as PredefinedType,
        orderedIds
      );

      res.json({
        success: true,
        message: 'Values reordered successfully',
      });
    }
  );
}
