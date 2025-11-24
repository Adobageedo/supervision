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
  dateDebutFrom?: Date;
  dateDebutTo?: Date;
  dateFinFrom?: Date;
  dateFinTo?: Date;
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
    intervenants: Partial<Intervenant>[],
    userId: string
  ): Promise<Intervention> {
    // Créer l'intervention
    const intervention = this.interventionRepository.create({
      ...data,
      createdById: userId,
    });

    // Sauvegarder l'intervention
    const savedIntervention = await this.interventionRepository.save(intervention);

    // Créer les intervenants
    if (intervenants && intervenants.length > 0) {
      const intervenantsToCreate = intervenants.map((int) =>
        this.intervenantRepository.create({
          ...int,
          interventionId: savedIntervention.id,
        })
      );
      await this.intervenantRepository.save(intervenantsToCreate);
    }

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
      relations: ['intervenants', 'createdBy', 'updatedBy'],
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
    const { page, limit, sortBy = 'dateDebut', sortOrder = 'DESC' } = pagination;

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
    if (filters.dateDebutFrom && filters.dateDebutTo) {
      where.dateDebut = Between(filters.dateDebutFrom, filters.dateDebutTo);
    } else if (filters.dateDebutFrom) {
      where.dateDebut = MoreThanOrEqual(filters.dateDebutFrom);
    } else if (filters.dateDebutTo) {
      where.dateDebut = LessThanOrEqual(filters.dateDebutTo);
    }

    // Recherche textuelle
    let queryBuilder = this.interventionRepository
      .createQueryBuilder('intervention')
      .leftJoinAndSelect('intervention.intervenants', 'intervenants')
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
    queryBuilder = queryBuilder
      .orderBy(`intervention.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit);

    const [interventions, total] = await queryBuilder.getManyAndCount();
    const pages = Math.ceil(total / limit);

    return { interventions, total, pages };
  }

  async updateIntervention(
    id: string,
    data: Partial<Intervention>,
    intervenants: Partial<Intervenant>[] | undefined,
    userId: string
  ): Promise<Intervention> {
    const intervention = await this.getInterventionById(id);

    // Stocker les anciennes valeurs pour l'audit
    const oldValues = { ...intervention };

    // Mettre à jour les champs
    Object.assign(intervention, data);
    intervention.updatedById = userId;

    await this.interventionRepository.save(intervention);

    // Gérer les intervenants si fournis
    if (intervenants !== undefined) {
      // Supprimer les anciens intervenants
      await this.intervenantRepository.delete({ interventionId: id });

      // Créer les nouveaux
      if (intervenants.length > 0) {
        const intervenantsToCreate = intervenants.map((int) =>
          this.intervenantRepository.create({
            ...int,
            interventionId: id,
          })
        );
        await this.intervenantRepository.save(intervenantsToCreate);
      }
    }

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
