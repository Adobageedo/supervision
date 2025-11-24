import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PredefinedValue, PredefinedValuesMap, PredefinedType } from '../models/predefined.model';
import { ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class PredefinedService {
  private apiUrl = `${environment.apiUrl}/predefined`;

  constructor(private http: HttpClient) {}

  getAllValues(): Observable<ApiResponse<{ values: PredefinedValuesMap }>> {
    return this.http.get<ApiResponse<{ values: PredefinedValuesMap }>>(this.apiUrl);
  }

  getValuesByType(type: PredefinedType): Observable<ApiResponse<{ values: PredefinedValue[] }>> {
    return this.http.get<ApiResponse<{ values: PredefinedValue[] }>>(`${this.apiUrl}/${type}`);
  }

  createValue(data: Partial<PredefinedValue>): Observable<ApiResponse<{ value: PredefinedValue }>> {
    return this.http.post<ApiResponse<{ value: PredefinedValue }>>(this.apiUrl, data);
  }

  updateValue(id: string, data: Partial<PredefinedValue>): Observable<ApiResponse<{ value: PredefinedValue }>> {
    return this.http.put<ApiResponse<{ value: PredefinedValue }>>(`${this.apiUrl}/${id}`, data);
  }

  deleteValue(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
