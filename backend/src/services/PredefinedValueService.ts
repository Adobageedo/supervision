import { AppDataSource } from '../config/database';
import { PredefinedValue, PredefinedType } from '../entities/PredefinedValue';
import { AppError } from '../middlewares/errorHandler';

export class PredefinedValueService {
  private predefinedValueRepository = AppDataSource.getRepository(PredefinedValue);

  async createValue(
    type: PredefinedType,
    value: string,
    description?: string
  ): Promise<PredefinedValue> {
    // Vérifier si la valeur existe déjà
    const existing = await this.predefinedValueRepository.findOne({
      where: { type, value },
    });

    if (existing) {
      throw new AppError('This value already exists for this type', 409);
    }

    const predefinedValue = this.predefinedValueRepository.create({
      type,
      value,
      description,
    });

    return await this.predefinedValueRepository.save(predefinedValue);
  }

  async getValuesByType(type: PredefinedType): Promise<PredefinedValue[]> {
    return await this.predefinedValueRepository.find({
      where: { type, isActive: true },
      order: { sortOrder: 'ASC', value: 'ASC' },
    });
  }

  async getAllValues(): Promise<Record<string, PredefinedValue[]>> {
    const allValues = await this.predefinedValueRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', value: 'ASC' },
    });

    const grouped: Record<string, PredefinedValue[]> = {};

    for (const type of Object.values(PredefinedType)) {
      grouped[type] = allValues.filter((v) => v.type === type);
    }

    return grouped;
  }

  async updateValue(
    id: string,
    data: Partial<PredefinedValue>
  ): Promise<PredefinedValue> {
    const value = await this.predefinedValueRepository.findOne({ where: { id } });

    if (!value) {
      throw new AppError('Predefined value not found', 404);
    }

    Object.assign(value, data);
    return await this.predefinedValueRepository.save(value);
  }

  async deleteValue(id: string): Promise<void> {
    const value = await this.predefinedValueRepository.findOne({ where: { id } });

    if (!value) {
      throw new AppError('Predefined value not found', 404);
    }

    await this.predefinedValueRepository.remove(value);
  }

  async deactivateValue(id: string): Promise<PredefinedValue> {
    return await this.updateValue(id, { isActive: false });
  }

  async reorderValues(type: PredefinedType, orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await this.predefinedValueRepository.update(
        { id: orderedIds[i], type },
        { sortOrder: i }
      );
    }
  }
}
