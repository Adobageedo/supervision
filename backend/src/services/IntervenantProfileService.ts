import { AppDataSource } from '../config/database';
import { Intervenant } from '../entities/Intervenant';
import { AppError } from '../middlewares/errorHandler';

export class IntervenantService {
  private intervenantRepository = AppDataSource.getRepository(Intervenant);

  async getAll(page: number = 1, limit: number = 100) {
    const [intervenants, total] = await this.intervenantRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      where: { isActive: true },
      order: { surname: 'ASC', name: 'ASC' },
      relations: ['company'],
    });

    // Map to include companyName and fullName
    const intervenantsWithDetails = intervenants.map((i: Intervenant) => ({
      ...i,
      companyName: i.company?.name,
      fullName: i.fullName,
      displayName: i.displayName,
    }));

    return { intervenants: intervenantsWithDetails, total, page, limit };
  }

  async getById(id: string) {
    const intervenant = await this.intervenantRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!intervenant) {
      throw new AppError('Intervenant not found', 404);
    }

    return {
      ...intervenant,
      companyName: intervenant.company?.name,
      fullName: intervenant.fullName,
      displayName: intervenant.displayName,
    };
  }

  async create(data: Partial<Intervenant>) {
    const intervenant = this.intervenantRepository.create(data);
    const saved = await this.intervenantRepository.save(intervenant);
    return this.getById(saved.id);
  }

  async update(id: string, data: Partial<Intervenant>) {
    const intervenant = await this.intervenantRepository.findOne({ where: { id } });
    if (!intervenant) {
      throw new AppError('Intervenant not found', 404);
    }
    Object.assign(intervenant, data);
    await this.intervenantRepository.save(intervenant);
    return this.getById(id);
  }

  async delete(id: string) {
    const intervenant = await this.intervenantRepository.findOne({ where: { id } });
    if (!intervenant) {
      throw new AppError('Intervenant not found', 404);
    }
    await this.intervenantRepository.remove(intervenant);
  }
}

// Keep old class name for backwards compatibility during migration
export class IntervenantProfileService extends IntervenantService {}
