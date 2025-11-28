import { AppDataSource } from '../config/database';
import { Company } from '../entities/Company';
import { AppError } from '../middlewares/errorHandler';

export class CompanyService {
  private companyRepository = AppDataSource.getRepository(Company);

  async getAll(page: number = 1, limit: number = 100) {
    const [companies, total] = await this.companyRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });

    return { companies, total, page, limit };
  }

  async getById(id: string) {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['intervenants'],
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    return company;
  }

  async create(data: Partial<Company>) {
    const company = this.companyRepository.create(data);
    return await this.companyRepository.save(company);
  }

  async update(id: string, data: Partial<Company>) {
    const company = await this.getById(id);
    Object.assign(company, data);
    return await this.companyRepository.save(company);
  }

  async delete(id: string) {
    const company = await this.getById(id);
    await this.companyRepository.remove(company);
  }
}
