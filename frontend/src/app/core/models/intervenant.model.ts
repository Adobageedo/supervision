export interface Intervenant {
  id: string;
  name: string;           // Last name
  surname: string;        // First name
  phone?: string;         // Optional
  email?: string;         // NEW: Email address
  country?: string;
  companyId?: string;
  companyName?: string;
  type?: string;          // Technicien, Ingénieur, etc.
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  fullName?: string;      // Computed: "surname name"
  displayName?: string;   // Computed: "name surname"
}

export interface InterventionIntervenant {
  id: string;
  interventionId: string;
  intervenantId: string;
  role?: string;          // Lead, Assistant, Observer, etc.
  createdAt: Date;
  intervenant?: Intervenant;
}

export interface IntervenantListResponse {
  intervenants: Intervenant[];
  total: number;
  page: number;
  limit: number;
}
