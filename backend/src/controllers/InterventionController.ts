import { Request, Response, NextFunction } from 'express';
import { InterventionService, InterventionFilters } from '../services/InterventionService';
import { asyncHandler } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import { stringify } from 'csv-stringify/sync';

export class InterventionController {
  private interventionService = new InterventionService();

  createIntervention = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { 
        intervenants, 
        titreEvenement, 
        dateRef,
        hasIntervention,
        intervenantEnregistre,
        dateDebutIntervention,
        dateFinIntervention,
        societeIntervenant,
        nombreIntervenant,
        hasPerteProduction,
        hasPerteCommunication,
        dateDebutIndisponibilite,
        indisponibiliteTerminee,
        dateFinIndisponibilite,
        rapportAttendu,
        rapportRecu,
        ...rest 
      } = req.body;
      const userId = req.user!.id;

      // DEBUG: Log incoming data
      console.log('🔍 [CONTROLLER] Incoming request body:', req.body);
      console.log('🔍 [CONTROLLER] typeEvenement:', rest.typeEvenement, Array.isArray(rest.typeEvenement));
      console.log('🔍 [CONTROLLER] typeDysfonctionnement:', rest.typeDysfonctionnement, Array.isArray(rest.typeDysfonctionnement));
      console.log('🔍 [CONTROLLER] hasIntervention:', hasIntervention);
      console.log('🔍 [CONTROLLER] hasPerteProduction:', hasPerteProduction);
      console.log('🔍 [CONTROLLER] hasPerteCommunication:', hasPerteCommunication);

      // Convert arrays to JSON strings BEFORE spreading rest
      const typeEvenementJson = rest.typeEvenement && Array.isArray(rest.typeEvenement) 
        ? JSON.stringify(rest.typeEvenement) 
        : (rest.typeEvenement || '[]');
      
      const typeDysfonctionnementJson = rest.typeDysfonctionnement && Array.isArray(rest.typeDysfonctionnement)
        ? JSON.stringify(rest.typeDysfonctionnement)
        : (rest.typeDysfonctionnement || '[]');

      console.log('✅ [CONTROLLER] typeEvenementJson:', typeEvenementJson);
      console.log('✅ [CONTROLLER] typeDysfonctionnementJson:', typeDysfonctionnementJson);

      // Map frontend field names to backend entity field names
      const interventionData: any = {
        titre: titreEvenement,
        dateRef: dateRef,
        entrepriseIntervenante: societeIntervenant,
        nombreIntervenant: nombreIntervenant,
        intervenantEnregistre: intervenantEnregistre,
        debutInter: dateDebutIntervention,
        finInter: dateFinIntervention,
        hasPerteProduction: !!hasPerteProduction,
        hasPerteCommunication: !!hasPerteCommunication,
        rapportAttendu: !!rapportAttendu,
        rapportRecu: !!rapportRecu,
        ...rest,
        typeEvenement: typeEvenementJson,
        typeDysfonctionnement: typeDysfonctionnementJson,
      };

      console.log('🔍 [CONTROLLER] Final interventionData:', interventionData);

      // TODO: Handle intervenant assignments with new schema
      // For now, pass empty array - will be updated when frontend uses new schema
      const intervenantsData: any[] = [];

      // Map unavailability dates if there were losses
      if (hasPerteProduction || hasPerteCommunication) {
        interventionData.dateIndisponibiliteDebut = dateDebutIndisponibilite;
        if (indisponibiliteTerminee) {
          interventionData.dateIndisponibiliteFin = dateFinIndisponibilite;
        }
      }

      const intervention = await this.interventionService.createIntervention(
        interventionData,
        intervenantsData,
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
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = req.query;

      const filters: InterventionFilters = {
        centrale: centrale as string,
        equipement: equipement as string,
        typeEvenement: typeEvenement as string,
        typeDysfonctionnement: typeDysfonctionnement as string,
        dateRefFrom: dateDebutFrom ? new Date(dateDebutFrom as string) : undefined,
        dateRefTo: dateDebutTo ? new Date(dateDebutTo as string) : undefined,
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
      const { 
        intervenants, 
        titreEvenement, 
        dateRef,
        hasIntervention,
        intervenantEnregistre,
        dateDebutIntervention,
        dateFinIntervention,
        societeIntervenant,
        nombreIntervenant,
        hasPerteProduction,
        hasPerteCommunication,
        dateDebutIndisponibilite,
        indisponibiliteTerminee,
        dateFinIndisponibilite,
        rapportAttendu,
        rapportRecu,
        ...rest 
      } = req.body;
      const userId = req.user!.id;

      // DEBUG: Log incoming data
      console.log('🔍 [CONTROLLER UPDATE] Incoming request body:', req.body);
      console.log('🔍 [CONTROLLER UPDATE] typeEvenement:', rest.typeEvenement, Array.isArray(rest.typeEvenement));
      console.log('🔍 [CONTROLLER UPDATE] typeDysfonctionnement:', rest.typeDysfonctionnement, Array.isArray(rest.typeDysfonctionnement));

      // Convert arrays to JSON strings BEFORE spreading rest
      const typeEvenementJson = rest.typeEvenement && Array.isArray(rest.typeEvenement) 
        ? JSON.stringify(rest.typeEvenement) 
        : rest.typeEvenement;
      
      const typeDysfonctionnementJson = rest.typeDysfonctionnement && Array.isArray(rest.typeDysfonctionnement)
        ? JSON.stringify(rest.typeDysfonctionnement)
        : rest.typeDysfonctionnement;

      // Map frontend field names to backend entity field names
      const interventionData: any = { 
        ...rest,
        typeEvenement: typeEvenementJson,
        typeDysfonctionnement: typeDysfonctionnementJson,
      };
      
      if (titreEvenement !== undefined) {
        interventionData.titre = titreEvenement;
      }
      if (dateRef !== undefined) {
        interventionData.dateRef = dateRef;
      }
      if (societeIntervenant !== undefined) {
        interventionData.entrepriseIntervenante = societeIntervenant;
      }
      if (nombreIntervenant !== undefined) {
        interventionData.nombreIntervenant = nombreIntervenant;
      }
      if (intervenantEnregistre !== undefined) {
        interventionData.intervenantEnregistre = intervenantEnregistre;
      }
      if (dateDebutIntervention !== undefined) {
        interventionData.debutInter = dateDebutIntervention;
      }
      if (dateFinIntervention !== undefined) {
        interventionData.finInter = dateFinIntervention;
      }
      
      // Update toggle fields with boolean conversion
      if (hasIntervention !== undefined) {
        // No longer used - intervention presence is determined by debutInter
      }
      if (hasPerteProduction !== undefined) {
        interventionData.hasPerteProduction = !!hasPerteProduction;
      }
      if (hasPerteCommunication !== undefined) {
        interventionData.hasPerteCommunication = !!hasPerteCommunication;
      }
      if (rapportAttendu !== undefined) {
        interventionData.rapportAttendu = !!rapportAttendu;
      }
      if (rapportRecu !== undefined) {
        interventionData.rapportRecu = !!rapportRecu;
      }

      console.log('✅ [CONTROLLER UPDATE] Final interventionData:', interventionData);

      // No longer need intervenants array - all data is in intervention fields

      // Map unavailability dates if there were losses
      if (hasPerteProduction || hasPerteCommunication) {
        interventionData.dateIndisponibiliteDebut = dateDebutIndisponibilite;
        if (indisponibiliteTerminee) {
          interventionData.dateIndisponibiliteFin = dateFinIndisponibilite;
        }
      }

      const intervention = await this.interventionService.updateIntervention(
        id,
        interventionData,
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
        dateRefFrom: dateDebutFrom ? new Date(dateDebutFrom as string) : undefined,
        dateRefTo: dateDebutTo ? new Date(dateDebutTo as string) : undefined,
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
        'Centrale Type': intervention.centraleType || '',
        Centrale: intervention.centrale,
        Equipement: intervention.equipement,
        'Entreprise Intervenante': intervention.entrepriseIntervenante || '',
        'Nombre Intervenant': intervention.nombreIntervenant || '',
        'Intervenant Enregistré': intervention.intervenantEnregistre || '',
        'Date Ref': intervention.dateRef || '',
        'Debut Inter': intervention.debutInter || '',
        'Fin Inter': intervention.finInter || '',
        'Durée (heures)': intervention.dureeHeures || '',
        'Date Indisponibilité Début': intervention.dateIndisponibiliteDebut || '',
        'Date Indisponibilité Fin': intervention.dateIndisponibiliteFin || '',
        'Indispo Terminée': intervention.indispoTerminee ? 'Oui' : 'Non',
        'Durée Indisponibilité (heures)': intervention.dureeIndisponibiliteHeures || '',
        'Type Événement': intervention.typeEvenement || '',
        'Type Dysfonctionnement': intervention.typeDysfonctionnement || '',
        'Perte Production': intervention.hasPerteProduction ? 'Oui' : 'Non',
        'Perte Communication': intervention.hasPerteCommunication ? 'Oui' : 'Non',
        'Rapport Attendu': intervention.rapportAttendu ? 'Oui' : 'Non',
        'Rapport Reçu': intervention.rapportRecu ? 'Oui' : 'Non',
        Commentaires: intervention.commentaires || '',
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
