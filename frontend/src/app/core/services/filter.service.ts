import { Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface FilterState {
  startDate: Date | null;
  endDate: Date | null;
  centrales: string[];
  equipements: string[];
  timeRange: 'last7days' | 'last30days' | 'currentMonth' | 'previousMonth' | 'custom';
}

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private filterState$ = new BehaviorSubject<FilterState>(this.getDefaultFilters());
  
  constructor(private router: Router) {
    // Initialize from URL on service creation
    this.loadFromUrl();
  }
  
  getFilters(): Observable<FilterState> {
    return this.filterState$.asObservable();
  }
  
  getCurrentFilters(): FilterState {
    return this.filterState$.value;
  }
  
  updateFilters(filters: Partial<FilterState>): void {
    const currentFilters = this.filterState$.value;
    const newFilters = { ...currentFilters, ...filters };
    
    this.filterState$.next(newFilters);
    this.saveToUrl(newFilters);
  }
  
  resetFilters(): void {
    const defaultFilters = this.getDefaultFilters();
    this.filterState$.next(defaultFilters);
    this.saveToUrl(defaultFilters);
  }
  
  private getDefaultFilters(): FilterState {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    
    return {
      startDate,
      endDate,
      centrales: [],
      equipements: [],
      timeRange: 'last7days'
    };
  }
  
  private loadFromUrl(): void {
    const params = new URLSearchParams(window.location.search);
    
    const startDateStr = params.get('startDate');
    const endDateStr = params.get('endDate');
    const centralesStr = params.get('centrales');
    const equipementsStr = params.get('equipements');
    const timeRange = params.get('timeRange') as FilterState['timeRange'];
    
    const filters: FilterState = this.getDefaultFilters();
    
    if (startDateStr) {
      filters.startDate = new Date(startDateStr);
    }
    
    if (endDateStr) {
      filters.endDate = new Date(endDateStr);
    }
    
    if (centralesStr) {
      filters.centrales = centralesStr.split(',').filter(c => c.length > 0);
    }
    
    if (equipementsStr) {
      filters.equipements = equipementsStr.split(',').filter(e => e.length > 0);
    }
    
    if (timeRange && ['last7days', 'last30days', 'currentMonth', 'previousMonth', 'custom'].includes(timeRange)) {
      filters.timeRange = timeRange;
    }
    
    this.filterState$.next(filters);
  }
  
  private saveToUrl(filters: FilterState): void {
    const queryParams: any = {};
    
    if (filters.startDate) {
      queryParams.startDate = filters.startDate.toISOString().split('T')[0];
    }
    
    if (filters.endDate) {
      queryParams.endDate = filters.endDate.toISOString().split('T')[0];
    }
    
    if (filters.centrales.length > 0) {
      queryParams.centrales = filters.centrales.join(',');
    }
    
    if (filters.equipements.length > 0) {
      queryParams.equipements = filters.equipements.join(',');
    }
    
    if (filters.timeRange) {
      queryParams.timeRange = filters.timeRange;
    }
    
    // Update URL without reloading the page
    this.router.navigate([], {
      relativeTo: this.router.routerState.root,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }
}
