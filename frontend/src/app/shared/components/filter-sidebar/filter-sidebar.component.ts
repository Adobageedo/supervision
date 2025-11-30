import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { FilterService, FilterState } from '../../../core/services/filter.service';
import { PredefinedService } from '../../../core/services/predefined.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './filter-sidebar.component.html',
  styleUrls: ['./filter-sidebar.component.scss']
})
export class FilterSidebarComponent implements OnInit, OnDestroy {
  isOpen = false;
  
  // Filter values
  timeRange: FilterState['timeRange'] = 'last7days';
  selectedCentrales: string[] = [];
  selectedEquipements: string[] = [];
  customStartDate = new FormControl(new Date());
  customEndDate = new FormControl(new Date());
  showCustomDatePicker = false;
  
  // Available options
  allCentrales: string[] = [];
  allEquipements: Map<string, string[]> = new Map();
  filteredCentrales: string[] = [];
  filteredEquipements: string[] = [];
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private filterService: FilterService,
    private predefinedService: PredefinedService
  ) {}
  
  ngOnInit(): void {
    this.loadPredefinedValues();
    this.loadCurrentFilters();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  toggle(): void {
    this.isOpen = !this.isOpen;
    this.updateBodyClass();
  }
  
  open(): void {
    this.isOpen = true;
    this.updateBodyClass();
  }
  
  close(): void {
    this.isOpen = false;
    this.updateBodyClass();
  }
  
  private updateBodyClass(): void {
    if (this.isOpen) {
      document.body.classList.add('filter-sidebar-open');
    } else {
      document.body.classList.remove('filter-sidebar-open');
    }
  }
  
  private loadPredefinedValues(): void {
    this.predefinedService.getAllValues().subscribe({
      next: (response: any) => {
        if (response.success) {
          const values = response.data.values;
          
          // Extract centrales
          if (values.centrale) {
            this.allCentrales = values.centrale.map((c: any) => c.value).sort();
          }
          
          // Extract equipements grouped by centrale
          if (values.equipement) {
            const centraleIdToName = new Map<string, string>();
            values.centrale?.forEach((c: any) => {
              centraleIdToName.set(c.id, c.value);
            });
            
            values.equipement.forEach((eq: any) => {
              if (eq.parentId && centraleIdToName.has(eq.parentId)) {
                const centraleName = centraleIdToName.get(eq.parentId)!;
                if (!this.allEquipements.has(centraleName)) {
                  this.allEquipements.set(centraleName, []);
                }
                if (!this.allEquipements.get(centraleName)!.includes(eq.value)) {
                  this.allEquipements.get(centraleName)!.push(eq.value);
                }
              }
            });
            
            // Sort equipements
            this.allEquipements.forEach((eqs, centrale) => {
              this.allEquipements.set(centrale, eqs.sort());
            });
          }
          
          this.updateFilteredOptions();
        }
      },
      error: (error) => {
        console.error('Error loading predefined values:', error);
      }
    });
  }
  
  private loadCurrentFilters(): void {
    this.filterService.getFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.timeRange = filters.timeRange;
        this.selectedCentrales = [...filters.centrales];
        this.selectedEquipements = [...filters.equipements];
        
        if (filters.startDate) {
          this.customStartDate.setValue(filters.startDate);
        }
        if (filters.endDate) {
          this.customEndDate.setValue(filters.endDate);
        }
        
        this.showCustomDatePicker = filters.timeRange === 'custom';
        this.updateFilteredOptions();
      });
  }
  
  onTimeRangeChange(range: FilterState['timeRange']): void {
    this.timeRange = range;
    this.showCustomDatePicker = range === 'custom';
    
    if (range !== 'custom') {
      const { startDate, endDate } = this.calculateDateRange(range);
      this.applyFilters(startDate, endDate);
    }
  }
  
  onCentraleSelectionChange(): void {
    // Update filtered equipements
    if (this.selectedCentrales.length > 0) {
      const equipementsSet = new Set<string>();
      this.selectedCentrales.forEach(centrale => {
        const equipements = this.allEquipements.get(centrale) || [];
        equipements.forEach(eq => equipementsSet.add(eq));
      });
      this.filteredEquipements = Array.from(equipementsSet).sort();
    } else {
      const allEquipementsSet = new Set<string>();
      this.allEquipements.forEach(equipements => {
        equipements.forEach(eq => allEquipementsSet.add(eq));
      });
      this.filteredEquipements = Array.from(allEquipementsSet).sort();
    }
  }
  
  onEquipementSelectionChange(): void {
    // Update filtered centrales
    if (this.selectedEquipements.length > 0) {
      const centralesSet = new Set<string>();
      this.selectedEquipements.forEach(eq => {
        this.allEquipements.forEach((equipements, centrale) => {
          if (equipements.includes(eq)) {
            centralesSet.add(centrale);
          }
        });
      });
      this.filteredCentrales = Array.from(centralesSet).sort();
    } else {
      this.filteredCentrales = [...this.allCentrales];
    }
  }
  
  private updateFilteredOptions(): void {
    this.onCentraleSelectionChange();
    this.onEquipementSelectionChange();
  }
  
  applyCustomDateRange(): void {
    const start = this.customStartDate.value;
    const end = this.customEndDate.value;
    
    if (start && end && start <= end) {
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      
      this.applyFilters(startDate, endDate);
    }
  }
  
  applyFilters(startDate?: Date, endDate?: Date): void {
    const filters: Partial<FilterState> = {
      timeRange: this.timeRange,
      centrales: this.selectedCentrales,
      equipements: this.selectedEquipements
    };
    
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    } else if (this.timeRange !== 'custom') {
      const dates = this.calculateDateRange(this.timeRange);
      filters.startDate = dates.startDate;
      filters.endDate = dates.endDate;
    }
    
    this.filterService.updateFilters(filters);
  }
  
  resetFilters(): void {
    this.filterService.resetFilters();
    this.selectedCentrales = [];
    this.selectedEquipements = [];
    this.timeRange = 'last7days';
    this.showCustomDatePicker = false;
    this.updateFilteredOptions();
  }
  
  removeCentrale(centrale: string): void {
    this.selectedCentrales = this.selectedCentrales.filter(c => c !== centrale);
    this.onCentraleSelectionChange();
  }
  
  removeEquipement(equipement: string): void {
    this.selectedEquipements = this.selectedEquipements.filter(e => e !== equipement);
    this.onEquipementSelectionChange();
  }
  
  private calculateDateRange(range: FilterState['timeRange']): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    
    switch (range) {
      case 'last7days':
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      
      case 'last30days':
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        break;
      
      case 'currentMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      
      case 'previousMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      
      default:
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
    }
    
    return { startDate, endDate };
  }
}
