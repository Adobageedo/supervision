import { User } from './user.model';

export interface Intervention {
  id: string;
  titre: string;
  centraleType?: string;
  centrale: string;
  equipement: string;
  entrepriseIntervenante?: string;
  nombreIntervenant?: number;
  intervenantEnregistre?: string;
  dateRef?: Date;
  debutInter?: Date;
  finInter?: Date;
  hasPerteProduction?: boolean;
  hasPerteCommunication?: boolean;
  indispoTerminee?: boolean;
  dateIndisponibiliteDebut?: Date;
  dateIndisponibiliteFin?: Date;
  typeEvenement?: string | string[];
  typeDysfonctionnement?: string | string[];
  rapportAttendu?: boolean;
  rapportRecu?: boolean;
  commentaires?: string;
  isArchived: boolean;
  archivedAt?: Date;
  createdBy?: User;
  createdById?: string;
  updatedBy?: User;
  updatedById?: string;
  createdAt: Date;
  updatedAt: Date;
  dureeHeures?: number;
  dureeIndisponibiliteHeures?: number;
}

export interface InterventionFilters {
  centrale?: string;
  equipement?: string;
  typeEvenement?: string;
  typeDysfonctionnement?: string;
  dateRefFrom?: Date | string;
  dateRefTo?: Date | string;
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
