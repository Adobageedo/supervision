import { Between, FindOptionsWhere, ILike, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Intervention } from '../entities/Intervention';
import { Intervenant } from '../entities/Intervenant';
import { AppError } from '../middlewares/errorHandler';
import { AuditService } from './AuditService';
import { AuditAction, AuditEntity } from '../entities/AuditLog';

export interface InterventionFilters {
  centrale?: string;
  equipement?: string;
  typeEvenement?: string;
  typeDysfonctionnement?: string;
  dateRefFrom?: Date;
  dateRefTo?: Date;
  isArchived?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export class InterventionService {
  private interventionRepository = AppDataSource.getRepository(Intervention);
  private intervenantRepository = AppDataSource.getRepository(Intervenant);
  private auditService = new AuditService();

  async createIntervention(
    data: Partial<Intervention>,
    intervenants: Partial<Intervenant>[] | any[],
    userId: string
  ): Promise<Intervention> {
    // Créer l'intervention
    const intervention = this.interventionRepository.create({
      ...data,
      createdById: userId,
    });

    // Sauvegarder l'intervention
    const savedIntervention = await this.interventionRepository.save(intervention);

    // Intervenant data is now stored directly in the intervention record:
    // - entrepriseIntervenante (company name)
    // - intervenantEnregistre (intervenant details)
    // - nombreIntervenant (count)
    // No junction table needed anymore

    // Log l'action
    await this.auditService.log({
      entityType: AuditEntity.INTERVENTION,
      entityId: savedIntervention.id,
      action: AuditAction.CREATE,
      newValues: savedIntervention,
      userId,
    });

    // Recharger avec les relations
    return await this.getInterventionById(savedIntervention.id);
  }

  async getInterventionById(id: string): Promise<Intervention> {
    const intervention = await this.interventionRepository.findOne({
      where: { id },
      relations: ['createdBy', 'updatedBy'],
    });

    if (!intervention) {
      throw new AppError('Intervention not found', 404);
    }

    return intervention;
  }

  async getAllInterventions(
    filters: InterventionFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 50 }
  ): Promise<{ interventions: Intervention[]; total: number; pages: number }> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'DESC' } = pagination;

    // Construction des filtres
    const where: FindOptionsWhere<Intervention> = {};

    if (filters.centrale) {
      where.centrale = filters.centrale;
    }

    if (filters.equipement) {
      where.equipement = filters.equipement;
    }

    if (filters.typeEvenement) {
      where.typeEvenement = filters.typeEvenement;
    }

    if (filters.typeDysfonctionnement) {
      where.typeDysfonctionnement = filters.typeDysfonctionnement;
    }

    if (filters.isArchived !== undefined) {
      where.isArchived = filters.isArchived;
    }

    // Filtres de dates
    if (filters.dateRefFrom && filters.dateRefTo) {
      where.dateRef = Between(filters.dateRefFrom, filters.dateRefTo);
    } else if (filters.dateRefFrom) {
      where.dateRef = MoreThanOrEqual(filters.dateRefFrom);
    } else if (filters.dateRefTo) {
      where.dateRef = LessThanOrEqual(filters.dateRefTo);
    }

    // Recherche textuelle
    let queryBuilder = this.interventionRepository
      .createQueryBuilder('intervention')
      .leftJoinAndSelect('intervention.createdBy', 'createdBy')
      .leftJoinAndSelect('intervention.updatedBy', 'updatedBy');

    // Appliquer les filtres
    Object.keys(where).forEach((key) => {
      queryBuilder = queryBuilder.andWhere(`intervention.${key} = :${key}`, {
        [key]: (where as any)[key],
      });
    });

    // Recherche plein texte
    if (filters.search) {
      queryBuilder = queryBuilder.andWhere(
        '(intervention.titre ILIKE :search OR intervention.commentaires ILIKE :search OR intervention.centrale ILIKE :search OR intervention.equipement ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Pagination et tri
    const skip = (page - 1) * limit;
    
    // Validate sortBy field to prevent errors
    const validSortFields = ['createdAt', 'updatedAt', 'dateRef', 'titre', 'centrale', 'equipement'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    
    queryBuilder = queryBuilder
      .orderBy(`intervention.${safeSortBy}`, sortOrder)
      .skip(skip)
      .take(limit);

    const [interventions, total] = await queryBuilder.getManyAndCount();
    const pages = Math.ceil(total / limit);

    return { interventions, total, pages };
  }

  async updateIntervention(
    id: string,
    data: Partial<Intervention>,
    userId: string
  ): Promise<Intervention> {
    const intervention = await this.getInterventionById(id);

    // Stocker les anciennes valeurs pour l'audit
    const oldValues = { ...intervention };

    // Mettre à jour les champs
    Object.assign(intervention, data);
    intervention.updatedById = userId;

    await this.interventionRepository.save(intervention);

    // Intervenant data is updated directly in the intervention record
    // No junction table management needed with simplified schema

    // Log l'action
    await this.auditService.log({
      entityType: AuditEntity.INTERVENTION,
      entityId: id,
      action: AuditAction.UPDATE,
      oldValues,
      newValues: data,
      userId,
    });

    return await this.getInterventionById(id);
  }

  async deleteIntervention(id: string, userId: string): Promise<void> {
    const intervention = await this.getInterventionById(id);

    // Log l'action avant suppression
    await this.auditService.log({
      entityType: AuditEntity.INTERVENTION,
      entityId: id,
      action: AuditAction.DELETE,
      oldValues: intervention,
      userId,
    });

    await this.interventionRepository.remove(intervention);
  }

  async archiveIntervention(id: string, userId: string): Promise<Intervention> {
    const intervention = await this.getInterventionById(id);

    intervention.isArchived = true;
    intervention.archivedAt = new Date();
    intervention.updatedById = userId;

    await this.interventionRepository.save(intervention);

    // Log l'action
    await this.auditService.log({
      entityType: AuditEntity.INTERVENTION,
      entityId: id,
      action: AuditAction.ARCHIVE,
      userId,
    });

    return intervention;
  }

  async restoreIntervention(id: string, userId: string): Promise<Intervention> {
    const intervention = await this.getInterventionById(id);

    intervention.isArchived = false;
    intervention.archivedAt = undefined;
    intervention.updatedById = userId;

    await this.interventionRepository.save(intervention);

    // Log l'action
    await this.auditService.log({
      entityType: AuditEntity.INTERVENTION,
      entityId: id,
      action: AuditAction.RESTORE,
      userId,
    });

    return intervention;
  }

  async getInterventionStats(): Promise<any> {
    const total = await this.interventionRepository.count();
    const archived = await this.interventionRepository.count({ where: { isArchived: true } });
    const active = total - archived;

    // Stats par centrale
    const byCentrale = await this.interventionRepository
      .createQueryBuilder('intervention')
      .select('intervention.centrale', 'centrale')
      .addSelect('COUNT(*)', 'count')
      .groupBy('intervention.centrale')
      .getRawMany();

    // Stats par type d'événement
    const byTypeEvenement = await this.interventionRepository
      .createQueryBuilder('intervention')
      .select('intervention.typeEvenement', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('intervention.typeEvenement')
      .getRawMany();

    return {
      total,
      active,
      archived,
      byCentrale,
      byTypeEvenement,
    };
  }
}
