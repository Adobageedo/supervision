import { Request, Response, NextFunction } from 'express';
import { InterventionService, InterventionFilters } from '../services/InterventionService';
import { asyncHandler } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import { stringify } from 'csv-stringify/sync';

export class InterventionController {
  private interventionService = new InterventionService();

  createIntervention = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { intervenants, ...interventionData } = req.body;
      const userId = req.user!.id;

      const intervention = await this.interventionService.createIntervention(
        interventionData,
        intervenants || [],
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Intervention created successfully',
        data: { intervention },
      });
    }
  );

  getInterventions = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        centrale,
        equipement,
        typeEvenement,
        typeDysfonctionnement,
        dateDebutFrom,
        dateDebutTo,
        isArchived,
        search,
        page = '1',
        limit = '50',
        sortBy = 'dateDebut',
        sortOrder = 'DESC',
      } = req.query;

      const filters: InterventionFilters = {
        centrale: centrale as string,
        equipement: equipement as string,
        typeEvenement: typeEvenement as string,
        typeDysfonctionnement: typeDysfonctionnement as string,
        dateDebutFrom: dateDebutFrom ? new Date(dateDebutFrom as string) : undefined,
        dateDebutTo: dateDebutTo ? new Date(dateDebutTo as string) : undefined,
        isArchived: isArchived === 'true',
        search: search as string,
      };

      const result = await this.interventionService.getAllInterventions(filters, {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'ASC' | 'DESC',
      });

      res.json({
        success: true,
        data: result,
      });
    }
  );

  getInterventionById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      const intervention = await this.interventionService.getInterventionById(id);

      res.json({
        success: true,
        data: { intervention },
      });
    }
  );

  updateIntervention = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { intervenants, ...interventionData } = req.body;
      const userId = req.user!.id;

      const intervention = await this.interventionService.updateIntervention(
        id,
        interventionData,
        intervenants,
        userId
      );

      res.json({
        success: true,
        message: 'Intervention updated successfully',
        data: { intervention },
      });
    }
  );

  deleteIntervention = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const userId = req.user!.id;

      await this.interventionService.deleteIntervention(id, userId);

      res.json({
        success: true,
        message: 'Intervention deleted successfully',
      });
    }
  );

  archiveIntervention = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const userId = req.user!.id;

      const intervention = await this.interventionService.archiveIntervention(
        id,
        userId
      );

      res.json({
        success: true,
        message: 'Intervention archived successfully',
        data: { intervention },
      });
    }
  );

  restoreIntervention = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const userId = req.user!.id;

      const intervention = await this.interventionService.restoreIntervention(
        id,
        userId
      );

      res.json({
        success: true,
        message: 'Intervention restored successfully',
        data: { intervention },
      });
    }
  );

  exportToCSV = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        centrale,
        equipement,
        typeEvenement,
        typeDysfonctionnement,
        dateDebutFrom,
        dateDebutTo,
        isArchived,
        search,
      } = req.query;

      const filters: InterventionFilters = {
        centrale: centrale as string,
        equipement: equipement as string,
        typeEvenement: typeEvenement as string,
        typeDysfonctionnement: typeDysfonctionnement as string,
        dateDebutFrom: dateDebutFrom ? new Date(dateDebutFrom as string) : undefined,
        dateDebutTo: dateDebutTo ? new Date(dateDebutTo as string) : undefined,
        isArchived: isArchived === 'true',
        search: search as string,
      };

      // Récupérer toutes les interventions (sans pagination)
      const result = await this.interventionService.getAllInterventions(filters, {
        page: 1,
        limit: 100000, // Large limit pour tout récupérer
      });

      // Préparer les données pour le CSV
      const csvData = result.interventions.map((intervention) => ({
        ID: intervention.id,
        Titre: intervention.titre,
        Centrale: intervention.centrale,
        Equipement: intervention.equipement,
        'Type Événement': intervention.typeEvenement,
        'Type Dysfonctionnement': intervention.typeDysfonctionnement,
        'Date Début': intervention.dateDebut,
        'Date Fin': intervention.dateFin || '',
        'Durée (heures)': intervention.dureeHeures || '',
        'Date Indisponibilité Début': intervention.dateIndisponibiliteDebut || '',
        'Date Indisponibilité Fin': intervention.dateIndisponibiliteFin || '',
        'Durée Indisponibilité (heures)': intervention.dureeIndisponibiliteHeures || '',
        Intervenants: intervention.intervenants
          .map((i) => i.nomComplet)
          .join('; '),
        Commentaires: intervention.commentaires || '',
        'Perte Production': intervention.perteProduction || '',
        'Perte Communication': intervention.perteCommunication || '',
        Archivé: intervention.isArchived ? 'Oui' : 'Non',
        'Créé le': intervention.createdAt,
        'Créé par': intervention.createdBy?.fullName || '',
      }));

      // Générer le CSV
      const csv = stringify(csvData, {
        header: true,
        delimiter: ',',
        quoted: true,
      });

      // Envoyer le fichier
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="interventions-${new Date().toISOString()}.csv"`
      );
      res.send('\uFEFF' + csv); // BOM pour Excel UTF-8
    }
  );

  getStats = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await this.interventionService.getInterventionStats();

      res.json({
        success: true,
        data: { stats },
      });
    }
  );
}
