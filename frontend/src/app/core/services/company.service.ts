import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Company, CompanyListResponse } from '../models/company.model';
import { ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private apiUrl = `${environment.apiUrl}/companies`;

  constructor(private http: HttpClient) {}

  getCompanies(params?: { page?: number; limit?: number }): Observable<ApiResponse<CompanyListResponse>> {
    return this.http.get<ApiResponse<CompanyListResponse>>(this.apiUrl, { params: params as any });
  }

  getCompany(id: string): Observable<ApiResponse<{ company: Company }>> {
    return this.http.get<ApiResponse<{ company: Company }>>(`${this.apiUrl}/${id}`);
  }

  createCompany(data: Partial<Company>): Observable<ApiResponse<{ company: Company }>> {
    return this.http.post<ApiResponse<{ company: Company }>>(this.apiUrl, data);
  }

  updateCompany(id: string, data: Partial<Company>): Observable<ApiResponse<{ company: Company }>> {
    return this.http.put<ApiResponse<{ company: Company }>>(`${this.apiUrl}/${id}`, data);
  }

  deleteCompany(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
