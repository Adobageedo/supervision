import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Intervention,
  InterventionFilters,
  InterventionListResponse,
  InterventionStats
} from '../models/intervention.model';
import { ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class InterventionService {
  private apiUrl = `${environment.apiUrl}/interventions`;

  constructor(private http: HttpClient) {}

  getInterventions(filters?: InterventionFilters): Observable<ApiResponse<InterventionListResponse>> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<ApiResponse<InterventionListResponse>>(this.apiUrl, { params });
  }

  getInterventionById(id: string): Observable<ApiResponse<{ intervention: Intervention }>> {
    return this.http.get<ApiResponse<{ intervention: Intervention }>>(`${this.apiUrl}/${id}`);
  }

  createIntervention(data: Partial<Intervention>): Observable<ApiResponse<{ intervention: Intervention }>> {
    return this.http.post<ApiResponse<{ intervention: Intervention }>>(this.apiUrl, data);
  }

  updateIntervention(id: string, data: Partial<Intervention>): Observable<ApiResponse<{ intervention: Intervention }>> {
    return this.http.put<ApiResponse<{ intervention: Intervention }>>(`${this.apiUrl}/${id}`, data);
  }

  deleteIntervention(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  archiveIntervention(id: string): Observable<ApiResponse<{ intervention: Intervention }>> {
    return this.http.post<ApiResponse<{ intervention: Intervention }>>(`${this.apiUrl}/${id}/archive`, {});
  }

  restoreIntervention(id: string): Observable<ApiResponse<{ intervention: Intervention }>> {
    return this.http.post<ApiResponse<{ intervention: Intervention }>>(`${this.apiUrl}/${id}/restore`, {});
  }

  getStats(): Observable<ApiResponse<{ stats: InterventionStats }>> {
    return this.http.get<ApiResponse<{ stats: InterventionStats }>>(`${this.apiUrl}/stats`);
  }

  exportToCsv(filters?: InterventionFilters): Observable<Blob> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get(`${this.apiUrl}/export/csv`, {
      params,
      responseType: 'blob'
    });
  }
}
