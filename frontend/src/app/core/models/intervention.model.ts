import { User } from './user.model';

export interface Intervention {
  id: string;
  titre: string;
  centrale: string;
  equipement: string;
  typeEvenement: string | string[]; // Can be string or array
  typeDysfonctionnement: string | string[]; // Can be string or array
  dateDebut: Date;
  dateFin?: Date;
  dateIndisponibiliteDebut?: Date;
  dateIndisponibiliteFin?: Date;
  commentaires?: string;
  perteProduction?: number;
  perteCommunication?: number;
  hasIntervention?: boolean;
  hasPerteProduction?: boolean;
  hasPerteCommunication?: boolean;
  rapportAttendu?: boolean;
  rapportRecu?: boolean;
  isArchived: boolean;
  archivedAt?: Date;
  intervenants: Intervenant[];
  createdBy?: User;
  createdById?: string;
  updatedBy?: User;
  updatedById?: string;
  createdAt: Date;
  updatedAt: Date;
  dureeHeures?: number;
  dureeIndisponibiliteHeures?: number;
}

export interface Intervenant {
  id?: string;
  nom: string;
  prenom?: string;
  type?: string;
  entreprise?: string;
  nomComplet?: string;
}

export interface InterventionFilters {
  centrale?: string;
  equipement?: string;
  typeEvenement?: string;
  typeDysfonctionnement?: string;
  dateDebutFrom?: Date | string;
  dateDebutTo?: Date | string;
  isArchived?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface InterventionListResponse {
  interventions: Intervention[];
  total: number;
  pages: number;
}

export interface InterventionStats {
  total: number;
  active: number;
  archived: number;
  byCentrale: Array<{ centrale: string; count: string }>;
  byTypeEvenement: Array<{ type: string; count: string }>;
}
