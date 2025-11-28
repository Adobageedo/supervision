import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Intervenant, IntervenantListResponse } from '../models/intervenant.model';
import { ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class IntervenantService {
  private apiUrl = `${environment.apiUrl}/intervenants`;

  constructor(private http: HttpClient) {}

  getIntervenants(params?: { page?: number; limit?: number }): Observable<ApiResponse<IntervenantListResponse>> {
    return this.http.get<ApiResponse<IntervenantListResponse>>(this.apiUrl, { params: params as any });
  }

  getIntervenant(id: string): Observable<ApiResponse<{ intervenant: Intervenant }>> {
    return this.http.get<ApiResponse<{ intervenant: Intervenant }>>(`${this.apiUrl}/${id}`);
  }

  createIntervenant(data: Partial<Intervenant>): Observable<ApiResponse<{ intervenant: Intervenant }>> {
    return this.http.post<ApiResponse<{ intervenant: Intervenant }>>(this.apiUrl, data);
  }

  updateIntervenant(id: string, data: Partial<Intervenant>): Observable<ApiResponse<{ intervenant: Intervenant }>> {
    return this.http.put<ApiResponse<{ intervenant: Intervenant }>>(`${this.apiUrl}/${id}`, data);
  }

  deleteIntervenant(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
