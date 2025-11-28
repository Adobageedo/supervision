export interface Company {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyListResponse {
  companies: Company[];
  total: number;
  page: number;
  limit: number;
}
