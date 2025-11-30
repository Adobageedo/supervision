import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../shared/material.module';
import { InterventionService } from '../../../core/services/intervention.service';
import { Intervention } from '../../../core/models/intervention.model';
import { Router } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FilterService, FilterState } from '../../../core/services/filter.service';
import { FilterSidebarComponent } from '../../../shared/components/filter-sidebar/filter-sidebar.component';

type ViewMode = 'day' | 'week' | 'month';

interface CalendarEvent {
  intervention: Intervention;
  startDate: Date;
  endDate: Date;
  color: string;
  position: number;
}

interface FilterColumn {
  key: string;
  label: string;
  enabled: boolean;
}

@Component({
  selector: 'app-intervention-planning',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule, FilterSidebarComponent],
  templateUrl: './intervention-planning.component.html',
  styleUrls: ['./intervention-planning.component.scss']
})
export class InterventionPlanningComponent implements OnInit {
  @ViewChild(FilterSidebarComponent) filterSidebar!: FilterSidebarComponent;
  
  viewMode: ViewMode = 'week';
  private currentFilters!: FilterState;
  currentDate = new Date();
  interventions: Intervention[] = [];
  calendarEvents: CalendarEvent[] = [];
  
  // Date range
  startDate!: Date;
  endDate!: Date;
  
  // Custom date range
  customStartDate = new FormControl(new Date());
  customEndDate = new FormControl(new Date());
  showCustomDatePicker = false;
  
  // Color mapping
  centraleColors: Map<string, string> = new Map();
  equipementColors: Map<string, string> = new Map();
  colorLegendMode: 'centrale' | 'equipement' = 'centrale';
  
  // Filter columns
  filterColumns: FilterColumn[] = [
    { key: 'centrale', label: 'Centrale', enabled: true },
    { key: 'equipement', label: 'Équipement', enabled: true },
    { key: 'typeEvenement', label: 'Type Événement', enabled: true },
    { key: 'intervenants', label: 'Intervenants', enabled: false },
    { key: 'statut', label: 'Statut', enabled: true },
  ];
  
  // Filters
  selectedCentrales: string[] = [];
  selectedEquipements: string[] = [];
  filteredCentrales: string[] = [];
  filteredEquipements: string[] = [];
  availableCentrales: string[] = [];
  availableEquipements: string[] = [];
  
  // Predefined colors
  private colors = [
    '#0969da', '#1f883d', '#cf222e', '#8250df', '#fb8500',
    '#0550ae', '#116329', '#a40e26', '#622cbc', '#d4a72c',
    '#218bff', '#26a641', '#f85149', '#a371f7', '#ffc107'
  ];

  constructor(
    private interventionService: InterventionService,
    public router: Router,
    private filterService: FilterService
  ) {}

  ngOnInit(): void {
    this.filterService.getFilters().subscribe(filters => {
      this.currentFilters = filters;
      this.updateDateRangeFromFilters(filters);
      this.updateCalendarEvents();
    });
    this.loadInterventions();
  }

  updateDateRange(): void {
    const now = new Date(this.currentDate);
    
    switch (this.viewMode) {
      case 'day':
        this.startDate = new Date(now.setHours(0, 0, 0, 0));
        this.endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
        
      case 'week':
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday start
        this.startDate = new Date(now.setDate(now.getDate() + diff));
        this.startDate.setHours(0, 0, 0, 0);
        this.endDate = new Date(this.startDate);
        this.endDate.setDate(this.endDate.getDate() + 6);
        this.endDate.setHours(23, 59, 59, 999);
        break;
        
      case 'month':
        this.startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        this.endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
    }
  }

  loadInterventions(): void {
    this.interventionService.getInterventions({ page: 1, limit: 1000 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.interventions = response.data.interventions.filter(i => !i.isArchived);
          this.assignColors();
          this.updateCalendarEvents();
        }
      },
      error: (error) => {
        console.error('Error loading interventions:', error);
      }
    });
  }

  assignColors(): void {
    // Assign colors to centrales
    const centrales = [...new Set(this.interventions.map(i => i.centrale))];
    centrales.forEach((centrale, index) => {
      this.centraleColors.set(centrale, this.colors[index % this.colors.length]);
    });
    
    // Assign colors to equipements
    const equipements = [...new Set(this.interventions.map(i => i.equipement))];
    equipements.forEach((equipement, index) => {
      this.equipementColors.set(equipement, this.colors[index % this.colors.length]);
    });
  }

  updateCalendarEvents(): void {
    this.calendarEvents = this.interventions
      .filter(intervention => {
        const startDate = new Date(intervention.debutInter || intervention.dateRef || new Date());
        const endDate = intervention.finInter ? new Date(intervention.finInter) : startDate;
        
        // Check if intervention overlaps with current view
        if (!(startDate <= this.endDate && endDate >= this.startDate)) {
          return false;
        }
        
        // Apply global centrale/equipement filters
        if (this.currentFilters) {
          if (this.currentFilters.centrales.length > 0 &&
              !this.currentFilters.centrales.includes(intervention.centrale)) {
            return false;
          }
          if (this.currentFilters.equipements.length > 0 &&
              !this.currentFilters.equipements.includes(intervention.equipement)) {
            return false;
          }
        }
        
        return true;
      })
      .map((intervention, index) => ({
        intervention,
        startDate: new Date(intervention.debutInter || intervention.dateRef || new Date()),
        endDate: intervention.finInter ? new Date(intervention.finInter) : new Date(intervention.debutInter || intervention.dateRef || new Date()),
        color: this.getEventColor(intervention),
        position: index
      }));
  }

  getEventColor(intervention: Intervention): string {
    if (this.colorLegendMode === 'centrale') {
      return this.centraleColors.get(intervention.centrale) || '#666';
    } else {
      return this.equipementColors.get(intervention.equipement) || '#666';
    }
  }

  changeViewMode(mode: ViewMode): void {
    this.viewMode = mode;
    this.showCustomDatePicker = false;
    this.updateDateRange();
    this.updateCalendarEvents();
  }

  navigatePrevious(): void {
    switch (this.viewMode) {
      case 'day':
        this.currentDate.setDate(this.currentDate.getDate() - 1);
        break;
      case 'week':
        this.currentDate.setDate(this.currentDate.getDate() - 7);
        break;
      case 'month':
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        break;
    }
    this.updateDateRange();
    this.updateCalendarEvents();
  }

  navigateNext(): void {
    switch (this.viewMode) {
      case 'day':
        this.currentDate.setDate(this.currentDate.getDate() + 1);
        break;
      case 'week':
        this.currentDate.setDate(this.currentDate.getDate() + 7);
        break;
      case 'month':
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        break;
    }
    this.updateDateRange();
    this.updateCalendarEvents();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.updateDateRange();
    this.updateCalendarEvents();
  }

  applyCustomDateRange(): void {
    if (this.customStartDate.value && this.customEndDate.value) {
      this.startDate = new Date(this.customStartDate.value);
      this.startDate.setHours(0, 0, 0, 0);
      this.endDate = new Date(this.customEndDate.value);
      this.endDate.setHours(23, 59, 59, 999);
      this.viewMode = 'week'; // Reset to week mode
      this.showCustomDatePicker = false;
      this.updateCalendarEvents();
    }
  }

  toggleColorLegend(): void {
    this.colorLegendMode = this.colorLegendMode === 'centrale' ? 'equipement' : 'centrale';
    this.updateCalendarEvents();
  }

  viewInterventionDetails(intervention: Intervention): void {
    this.router.navigate(['/interventions', intervention.id]);
  }

  getDateRangeLabel(): string {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    
    if (this.viewMode === 'day') {
      return this.startDate.toLocaleDateString('fr-FR', options);
    } else if (this.viewMode === 'week') {
      return `${this.startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${this.endDate.toLocaleDateString('fr-FR', options)}`;
    } else {
      return this.startDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
  }

  getWeekDays(): Date[] {
    const days: Date[] = [];
    const current = new Date(this.startDate);
    
    for (let i = 0; i < 7; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }

  getMonthDays(): Date[] {
    const days: Date[] = [];
    const firstDay = new Date(this.startDate);
    const lastDay = new Date(this.endDate);
    
    // Start from Monday of the week containing the first day
    const startDay = new Date(firstDay);
    const dayOfWeek = startDay.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDay.setDate(startDay.getDate() + diff);
    
    // End on Sunday of the week containing the last day
    const endDay = new Date(lastDay);
    const endDayOfWeek = endDay.getDay();
    const endDiff = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;
    endDay.setDate(endDay.getDate() + endDiff);
    
    const current = new Date(startDay);
    while (current <= endDay) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }

  getEventsForDay(day: Date): CalendarEvent[] {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    
    return this.calendarEvents.filter(event => 
      event.startDate <= dayEnd && event.endDate >= dayStart
    );
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentDate.getMonth();
  }

  getFilteredColumns(): FilterColumn[] {
    return this.filterColumns.filter(col => col.enabled);
  }

  getColumnValue(intervention: Intervention, key: string): string {
    switch (key) {
      case 'centrale':
        return intervention.centrale;
      case 'equipement':
        return intervention.equipement;
      case 'typeEvenement':
        return this.parseTypeArray(intervention.typeEvenement || '');
      case 'intervenants':
        return intervention.intervenantEnregistre || '-';
      case 'statut':
        return this.getStatutLabel(intervention);
      default:
        return '-';
    }
  }

  parseTypeArray(value: string | string[]): string {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.join(', ') : value;
      } catch {
        return value;
      }
    }
    return '-';
  }

  getStatutLabel(intervention: Intervention): string {
    if (intervention.isArchived) return 'Archivée';
    if (intervention.finInter || intervention.dateIndisponibiliteFin) return 'Terminée';
    return 'En cours';
  }

  onCentraleSelectionChange(): void {
    this.updateCalendarEvents();
  }

  onEquipementSelectionChange(): void {
    this.updateCalendarEvents();
  }
  
  private updateDateRangeFromFilters(filters: FilterState): void {
    if (filters.startDate && filters.endDate) {
      this.startDate = new Date(filters.startDate);
      this.endDate = new Date(filters.endDate);
    } else {
      // Fallback to existing viewMode logic
      this.updateDateRange();
    }
  }
  
  getFilteredLegendItems(): Array<{key: string; value: string}> {
    const items: Array<{key: string; value: string}> = [];
    
    if (this.colorLegendMode === 'centrale') {
      // Get unique centrales from filtered events
      const centrales = new Set(this.calendarEvents.map(e => e.intervention.centrale));
      centrales.forEach(centrale => {
        const color = this.centraleColors.get(centrale);
        if (color) {
          items.push({ key: centrale, value: color });
        }
      });
    } else {
      // Get unique equipements from filtered events with their centrale
      const equipementMap = new Map<string, string>(); // equipement -> centrale
      this.calendarEvents.forEach(e => {
        const key = `${e.intervention.centrale} - ${e.intervention.equipement}`;
        if (!equipementMap.has(key)) {
          equipementMap.set(key, e.intervention.equipement);
        }
      });
      
      equipementMap.forEach((equipement, key) => {
        const color = this.equipementColors.get(equipement);
        if (color) {
          items.push({ key: key, value: color });
        }
      });
    }
    
    return items.sort((a, b) => a.key.localeCompare(b.key));
  }
}
