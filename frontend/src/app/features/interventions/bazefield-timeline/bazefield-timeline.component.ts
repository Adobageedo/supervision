import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../shared/material.module';
import { InterventionService } from '../../../core/services/intervention.service';
import { PredefinedService } from '../../../core/services/predefined.service';
import { Intervention } from '../../../core/models/intervention.model';
import { Router } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { FilterService, FilterState } from '../../../core/services/filter.service';
import { FilterSidebarComponent } from '../../../shared/components/filter-sidebar/filter-sidebar.component';

type TimeRange = 'last7days' | 'last30days' | 'currentMonth' | 'previousMonth' | 'custom';
type TimeGranularity = 'minute' | 'hour' | 'day' | 'month';

interface TimelineRow {
  centrale: string;
  equipement: string;
  blocks: InterventionBlock[];
}

interface InterventionBlock {
  startDate: Date;
  endDate: Date;
  status: 'available' | 'intervention' | 'indispo' | 'both';
  interventions: Intervention[];
  leftPosition: number; // pixels
  width: number; // pixels
}

interface TimeSlotHeader {
  date: Date;
  label: string;
  colspan: number;
  isGroupHeader: boolean; // for day/month grouping
}

interface DateDisplayConfig {
  granularity: TimeGranularity;
  showDayName: boolean;
  showDayNumber: boolean;
  showMonth: boolean;
  showYear: boolean;
  showHour: boolean;
  cellWidth: number;
}

@Component({
  selector: 'app-bazefield-timeline',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule, FilterSidebarComponent],
  templateUrl: './bazefield-timeline.component.html',
  styleUrls: ['./bazefield-timeline.component.scss']
})
export class BazefieldTimelineComponent implements OnInit {
  @ViewChild(FilterSidebarComponent) filterSidebar!: FilterSidebarComponent;
  
  timeRange: TimeRange = 'last7days';
  startDate!: Date;
  endDate!: Date;
  timeSlots: Date[] = [];
  groupedHeaders: { day?: string; month?: string; slots: TimeSlotHeader[] }[] = [];
  
  interventions: Intervention[] = [];
  timelineRows: TimelineRow[] = [];
  
  // Custom date range
  customStartDate = new FormControl(new Date());
  customEndDate = new FormControl(new Date());
  showCustomDatePicker = false;
  
  // Display configuration
  displayConfig!: DateDisplayConfig;
  zoomLevel: number = 1; // 1 = 100%, 0.5 = 50%, 2 = 200%
  timelineWidth: number = 0; // Total width in pixels
  
  // Filters
  selectedCentrales: string[] = [];
  selectedEquipements: string[] = [];
  allCentrales: string[] = [];
  allEquipements: Map<string, string[]> = new Map();
  
  // Filtered options for dropdowns
  filteredCentrales: string[] = [];
  filteredEquipements: string[] = [];
  
  constructor(
    private interventionService: InterventionService,
    private predefinedService: PredefinedService,
    private router: Router,
    private filterService: FilterService
  ) {}

  ngOnInit(): void {
    this.filterService.getFilters().subscribe(filters => {
      this.applyFilterState(filters);
    });
    this.loadInterventions();
  }
  
  zoomIn(): void {
    if (this.zoomLevel < 3) {
      this.zoomLevel += 0.25;
      this.applyZoom();
    }
  }
  
  zoomOut(): void {
    if (this.zoomLevel > 0.25) {
      this.zoomLevel -= 0.25;
      this.applyZoom();
    }
  }
  
  resetZoom(): void {
    this.zoomLevel = 1;
    this.applyZoom();
  }
  
  applyZoom(): void {
    // Recalculate display config with zoom applied
    this.determineDisplayConfig();
    // Apply zoom to cell width
    const baseCellWidth = this.displayConfig.cellWidth;
    this.displayConfig.cellWidth = Math.round(baseCellWidth * this.zoomLevel);
    // Regenerate headers with new widths
    this.generateGroupedHeaders();
    // Regenerate timeline rows to update intervention block positions
    this.buildTimeline();
  }

  updateDateRange(): void {
    const now = new Date();
    
    if (this.timeRange !== 'custom') {
      switch (this.timeRange) {
        case 'last7days':
          this.endDate = new Date(now);
          this.endDate.setHours(23, 59, 59, 999);
          this.startDate = new Date(now);
          this.startDate.setDate(this.startDate.getDate() - 6);
          this.startDate.setHours(0, 0, 0, 0);
          break;
          
        case 'last30days':
          this.endDate = new Date(now);
          this.endDate.setHours(23, 59, 59, 999);
          this.startDate = new Date(now);
          this.startDate.setDate(this.startDate.getDate() - 29);
          this.startDate.setHours(0, 0, 0, 0);
          break;
          
        case 'currentMonth':
          this.startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          this.endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
          
        case 'previousMonth':
          this.startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          this.endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          break;
      }
    }
    
    this.determineDisplayConfig();
    this.generateTimeSlots();
    this.generateGroupedHeaders();
  }

  determineDisplayConfig(): void {
    const totalMinutes = (this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60);
    const totalHours = totalMinutes / 60;
    const totalDays = totalHours / 24;
    
    // Intelligent granularity selection based on timeframe
    if (totalHours <= 6) {
      // Less than 6 hours: show every 15 minutes
      this.displayConfig = {
        granularity: 'minute',
        showDayName: false,
        showDayNumber: true,
        showMonth: false,
        showYear: false,
        showHour: true,
        cellWidth: 40
      };
    } else if (totalHours <= 24) {
      // 6-24 hours: show every hour
      this.displayConfig = {
        granularity: 'hour',
        showDayName: false,
        showDayNumber: true,
        showMonth: false,
        showYear: false,
        showHour: true,
        cellWidth: 50
      };
    } else if (totalDays <= 7) {
      // 1-7 days: show every 2 hours with day name
      this.displayConfig = {
        granularity: 'hour',
        showDayName: true,
        showDayNumber: true,
        showMonth: false,
        showYear: false,
        showHour: true,
        cellWidth: 60
      };
    } else if (totalDays <= 31) {
      // 1 month: show days with day number and month
      this.displayConfig = {
        granularity: 'day',
        showDayName: false,
        showDayNumber: true,
        showMonth: true,
        showYear: false,
        showHour: false,
        cellWidth: 40
      };
    } else if (totalDays <= 90) {
      // 2-3 months: show days compact
      this.displayConfig = {
        granularity: 'day',
        showDayName: false,
        showDayNumber: true,
        showMonth: true,
        showYear: false,
        showHour: false,
        cellWidth: 35
      };
    } else {
      // More than 3 months: show months
      this.displayConfig = {
        granularity: 'month',
        showDayName: false,
        showDayNumber: false,
        showMonth: true,
        showYear: true,
        showHour: false,
        cellWidth: 80
      };
    }
  }

  generateGroupedHeaders(): void {
    this.groupedHeaders = [];
    const config = this.displayConfig;
    
    // Calculate total timeline width
    this.timelineWidth = this.timeSlots.length * config.cellWidth;
    
    if (config.granularity === 'minute' || config.granularity === 'hour') {
      // Group by day
      const dayGroups = new Map<string, Date[]>();
      
      this.timeSlots.forEach(slot => {
        const dayKey = `${slot.getFullYear()}-${slot.getMonth()}-${slot.getDate()}`;
        if (!dayGroups.has(dayKey)) {
          dayGroups.set(dayKey, []);
        }
        dayGroups.get(dayKey)!.push(slot);
      });
      
      dayGroups.forEach((slots, dayKey) => {
        const firstSlot = slots[0];
        const dayLabel = firstSlot.toLocaleDateString('fr-FR', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        });
        
        this.groupedHeaders.push({
          day: dayLabel,
          slots: slots.map(slot => ({
            date: slot,
            label: this.getTimeSlotHeaderPrimary(slot),
            colspan: 1,
            isGroupHeader: false
          }))
        });
      });
    } else if (config.granularity === 'day') {
      // Group by month
      const monthGroups = new Map<string, Date[]>();
      
      this.timeSlots.forEach(slot => {
        const monthKey = `${slot.getFullYear()}-${slot.getMonth()}`;
        if (!monthGroups.has(monthKey)) {
          monthGroups.set(monthKey, []);
        }
        monthGroups.get(monthKey)!.push(slot);
      });
      
      monthGroups.forEach((slots, monthKey) => {
        const firstSlot = slots[0];
        const monthLabel = firstSlot.toLocaleDateString('fr-FR', { 
          month: 'long', 
          year: 'numeric' 
        });
        
        this.groupedHeaders.push({
          month: monthLabel,
          slots: slots.map(slot => ({
            date: slot,
            label: slot.getDate().toString(),
            colspan: 1,
            isGroupHeader: false
          }))
        });
      });
    } else {
      // Month granularity - no grouping needed
      this.groupedHeaders.push({
        slots: this.timeSlots.map(slot => ({
          date: slot,
          label: this.getTimeSlotHeaderPrimary(slot),
          colspan: 1,
          isGroupHeader: false
        }))
      });
    }
  }

  generateTimeSlots(): void {
    this.timeSlots = [];
    const current = new Date(this.startDate);
    const totalHours = (this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60);
    const totalDays = totalHours / 24;
    
    switch (this.displayConfig.granularity) {
      case 'minute':
        // Show every 15 minutes for very short periods
        while (current <= this.endDate) {
          this.timeSlots.push(new Date(current));
          current.setMinutes(current.getMinutes() + 15);
        }
        break;
        
      case 'hour':
        // Adjust hour interval based on total days
        const hourInterval = totalDays <= 1 ? 1 : totalDays <= 7 ? 2 : 4;
        while (current <= this.endDate) {
          this.timeSlots.push(new Date(current));
          current.setHours(current.getHours() + hourInterval);
        }
        break;
        
      case 'day':
        while (current <= this.endDate) {
          this.timeSlots.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
        break;
        
      case 'month':
        const monthCurrent = new Date(current.getFullYear(), current.getMonth(), 1);
        while (monthCurrent <= this.endDate) {
          this.timeSlots.push(new Date(monthCurrent));
          monthCurrent.setMonth(monthCurrent.getMonth() + 1);
        }
        break;
    }
  }

  loadInterventions(): void {
    // Load both interventions and predefined values
    forkJoin({
      interventions: this.interventionService.getInterventions({ page: 1, limit: 1000 }),
      predefined: this.predefinedService.getAllValues()
    }).subscribe({
      next: ({ interventions, predefined }) => {
        if (interventions.success) {
          this.interventions = interventions.data.interventions;
        }
        
        // Get all centrales and equipements from predefined values
        if (predefined.success) {
          const centrales = predefined.data.values.centrale || [];
          const equipements = predefined.data.values.equipement || [];
          
          // Build centrale to equipements mapping from predefined
          this.allCentrales = centrales.map(c => c.value).sort();
          
          // Create a map of centrale ID to centrale name
          const centraleIdToName = new Map<string, string>();
          centrales.forEach(c => {
            centraleIdToName.set(c.id, c.value);
          });
          
          // Group equipements by centrale using parentId
          equipements.forEach(eq => {
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
          
          // Sort equipements for each centrale
          this.allEquipements.forEach((eqs, centrale) => {
            this.allEquipements.set(centrale, eqs.sort());
          });
        }
        
        // ALSO extract centrales/equipements from actual intervention data
        // This ensures we show rows even if they're not in predefined values
        this.interventions.forEach(intervention => {
          const centrale = intervention.centrale;
          const equipement = intervention.equipement;
          
          // Add centrale if not already present
          if (!this.allCentrales.includes(centrale)) {
            this.allCentrales.push(centrale);
          }
          
          // Add equipement to centrale mapping
          if (!this.allEquipements.has(centrale)) {
            this.allEquipements.set(centrale, []);
          }
          if (!this.allEquipements.get(centrale)!.includes(equipement)) {
            this.allEquipements.get(centrale)!.push(equipement);
          }
        });
        
        // Sort everything
        this.allCentrales.sort();
        this.allEquipements.forEach((eqs, centrale) => {
          this.allEquipements.set(centrale, eqs.sort());
        });
        
        this.updateFilteredOptions();
        this.buildTimeline();
      },
      error: (error) => {
        console.error('Error loading data:', error);
      }
    });
  }
  
  updateFilteredOptions(): void {
    // Filter centrales based on selected equipements
    if (this.selectedEquipements.length > 0) {
      const centralesWithSelectedEquipements = new Set<string>();
      this.selectedEquipements.forEach(eq => {
        this.allEquipements.forEach((equipements, centrale) => {
          if (equipements.includes(eq)) {
            centralesWithSelectedEquipements.add(centrale);
          }
        });
      });
      this.filteredCentrales = Array.from(centralesWithSelectedEquipements).sort();
    } else {
      this.filteredCentrales = [...this.allCentrales];
    }
  }

  buildTimeline(): void {
    this.timelineRows = [];
    
    // Filter centrales
    const centralesToShow = this.selectedCentrales.length > 0 
      ? this.selectedCentrales 
      : this.allCentrales;
    
    const totalDuration = this.endDate.getTime() - this.startDate.getTime();
    
    centralesToShow.forEach(centrale => {
      const equipements = this.allEquipements.get(centrale) || [];
      
      // Filter equipements
      const equipementsToShow = this.selectedEquipements.length > 0
        ? equipements.filter(eq => this.selectedEquipements.includes(eq))
        : equipements;
      
      equipementsToShow.forEach(equipement => {
        const blocks = this.createInterventionBlocks(centrale, equipement, totalDuration);
        
        this.timelineRows.push({
          centrale,
          equipement,
          blocks
        });
      });
    });
  }

  createInterventionBlocks(centrale: string, equipement: string, totalDuration: number): InterventionBlock[] {
    // Get all interventions for this equipment
    const equipmentInterventions = this.interventions.filter(i => 
      i.centrale === centrale && i.equipement === equipement
    );
    
    const blocks: InterventionBlock[] = [];
    
    // Sort interventions by start date
    const sortedInterventions = equipmentInterventions
      .map(i => ({
        intervention: i,
        start: new Date(i.debutInter || i.dateRef || new Date()),
        end: i.finInter ? new Date(i.finInter) : this.endDate // If no end date, continue to timeline end
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    
    let currentTime = new Date(this.startDate);
    
    sortedInterventions.forEach(({ intervention, start, end }) => {
      // Clamp to timeline boundaries
      const blockStart = start < this.startDate ? this.startDate : start;
      const blockEnd = end > this.endDate ? this.endDate : end;
      
      // Add available block before intervention if there's a gap
      if (currentTime < blockStart) {
        const gapStart = currentTime;
        const gapEnd = blockStart;
        const leftPos = ((gapStart.getTime() - this.startDate.getTime()) / totalDuration) * this.timelineWidth;
        const width = ((gapEnd.getTime() - gapStart.getTime()) / totalDuration) * this.timelineWidth;
        
        blocks.push({
          startDate: gapStart,
          endDate: gapEnd,
          status: 'available',
          interventions: [],
          leftPosition: leftPos,
          width: width
        });
      }
      
      // Add intervention block
      const leftPos = ((blockStart.getTime() - this.startDate.getTime()) / totalDuration) * this.timelineWidth;
      const width = ((blockEnd.getTime() - blockStart.getTime()) / totalDuration) * this.timelineWidth;
      
      // Determine status
      const hasIndispo = intervention.hasPerteProduction || intervention.hasPerteCommunication ||
                        (intervention.dateIndisponibiliteDebut && intervention.dateIndisponibiliteFin);
      const hasIntervention = intervention.debutInter ? true : false;
      
      let status: 'available' | 'intervention' | 'indispo' | 'both';
      if (hasIntervention && hasIndispo) {
        status = 'both';
      } else if (hasIndispo) {
        status = 'indispo';
      } else if (hasIntervention) {
        status = 'intervention';
      } else {
        status = 'available';
      }
      
      blocks.push({
        startDate: blockStart,
        endDate: blockEnd,
        status: status,
        interventions: [intervention],
        leftPosition: leftPos,
        width: width
      });
      
      currentTime = blockEnd;
    });
    
    // Add final available block if needed
    if (currentTime < this.endDate) {
      blocks.push({
        startDate: currentTime,
        endDate: this.endDate,
        status: 'available',
        interventions: [],
        leftPosition: ((currentTime.getTime() - this.startDate.getTime()) / totalDuration) * this.timelineWidth,
        width: ((this.endDate.getTime() - currentTime.getTime()) / totalDuration) * this.timelineWidth
      });
    }
    
    return blocks;
  }

  changeTimeRange(range: TimeRange): void {
    this.timeRange = range;
    if (range === 'custom') {
      this.showCustomDatePicker = true;
    } else {
      this.showCustomDatePicker = false;
      this.updateDateRange();
      this.buildTimeline();
    }
  }

  applyCustomDateRange(): void {
    if (this.customStartDate.value && this.customEndDate.value) {
      this.startDate = new Date(this.customStartDate.value);
      this.startDate.setHours(0, 0, 0, 0);
      this.endDate = new Date(this.customEndDate.value);
      this.endDate.setHours(23, 59, 59, 999);
      this.timeRange = 'custom';
      this.showCustomDatePicker = false;
      this.updateDateRange();
      this.buildTimeline();
    }
  }

  applyFilters(): void {
    this.updateFilteredOptions();
    this.buildTimeline();
  }
  
  onCentraleSelectionChange(): void {
    // Remove selected equipements that don't belong to selected centrales
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
    this.applyFilters();
  }
  
  onEquipementSelectionChange(): void {
    // Remove selected centrales that don't have any of the selected equipements
    if (this.selectedEquipements.length > 0) {
      const validCentrales = new Set<string>();
      this.selectedEquipements.forEach(eq => {
        this.allEquipements.forEach((equipements, centrale) => {
          if (equipements.includes(eq)) {
            validCentrales.add(centrale);
          }
        });
      });
      this.selectedCentrales = this.selectedCentrales.filter(c => validCentrales.has(c));
    }
    this.applyFilters();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'available':
        return '#1a7f37'; // Green
      case 'intervention':
        return '#0969da'; // Blue
      case 'indispo':
        return '#cf222e'; // Red
      case 'both':
        return '#8250df'; // Purple
      default:
        return '#d0d7de'; // Gray
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'intervention':
        return 'Intervention';
      case 'indispo':
        return 'Indisponible';
      case 'both':
        return 'Intervention + Indispo';
      default:
        return '';
    }
  }

  getTimeRangeLabel(): string {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    
    if (this.timeRange === 'currentMonth') {
      return this.startDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    } else if (this.timeRange === 'previousMonth') {
      return this.startDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    } else {
      return `${this.startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${this.endDate.toLocaleDateString('fr-FR', options)}`;
    }
  }

  viewDayDetails(block: InterventionBlock): void {
    if (block.interventions.length > 0) {
      // If only one intervention, navigate to it
      if (block.interventions.length === 1) {
        this.router.navigate(['/interventions', block.interventions[0].id]);
      } else {
        // Could open a dialog showing all interventions for this block
        console.log('Multiple interventions:', block.interventions);
      }
    }
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  getTimeSlotLabel(slot: Date): string {
    const config = this.displayConfig;
    
    if (config.granularity === 'minute') {
      return `${slot.getHours()}:${slot.getMinutes().toString().padStart(2, '0')}`;
    }
    
    if (config.granularity === 'hour') {
      if (config.showDayNumber && config.showMonth) {
        return `${slot.getDate()}/${slot.getMonth() + 1} ${slot.getHours()}h`;
      }
      return `${slot.getHours()}h`;
    }
    
    if (config.granularity === 'day') {
      if (config.showDayName && config.showDayNumber) {
        return slot.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
      }
      if (config.showDayNumber && config.showMonth) {
        return `${slot.getDate()}/${slot.getMonth() + 1}`;
      }
      return slot.getDate().toString();
    }
    
    if (config.granularity === 'month') {
      if (config.showYear) {
        return slot.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      }
      return slot.toLocaleDateString('fr-FR', { month: 'short' });
    }
    
    return slot.toLocaleDateString('fr-FR');
  }

  getTimeSlotHeaderPrimary(slot: Date): string {
    const config = this.displayConfig;
    
    if (config.granularity === 'minute') {
      return `${slot.getHours()}:${slot.getMinutes().toString().padStart(2, '0')}`;
    }
    
    if (config.granularity === 'hour') {
      return `${slot.getHours()}h`;
    }
    
    if (config.granularity === 'day') {
      if (config.showDayName) {
        return slot.toLocaleDateString('fr-FR', { weekday: 'short' });
      }
      return slot.getDate().toString();
    }
    
    if (config.granularity === 'month') {
      return slot.toLocaleDateString('fr-FR', { month: 'short' });
    }
    
    return '';
  }

  getTimeSlotHeaderSecondary(slot: Date): string {
    const config = this.displayConfig;
    
    if (config.granularity === 'minute') {
      if (config.showDayNumber) {
        return `${slot.getDate()}/${slot.getMonth() + 1}`;
      }
      return '';
    }
    
    if (config.granularity === 'hour') {
      if (config.showDayNumber) {
        if (config.showDayName) {
          return slot.toLocaleDateString('fr-FR', { weekday: 'short' });
        }
        return `${slot.getDate()}/${slot.getMonth() + 1}`;
      }
      return '';
    }
    
    if (config.granularity === 'day') {
      if (config.showDayNumber) {
        return slot.getDate().toString();
      }
      if (config.showMonth) {
        return `${slot.getDate()}/${slot.getMonth() + 1}`;
      }
      return '';
    }
    
    if (config.granularity === 'month') {
      if (config.showYear) {
        return slot.getFullYear().toString();
      }
      return '';
    }
    
    return '';
  }

  getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  getTooltipText(block: InterventionBlock): string {
    if (block.interventions.length === 0) {
      return this.getStatusLabel(block.status);
    }
    
    const statusLabel = this.getStatusLabel(block.status);
    const titles = block.interventions.map((i: Intervention) => `• ${i.titre}`).join('\n');
    const timeRange = `${block.startDate.toLocaleString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    })} - ${block.endDate.toLocaleString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
    
    return `${statusLabel}\n${timeRange}\n\n${titles}`;
  }

  backToInterventions(): void {
    this.router.navigate(['/interventions']);
  }
  
  private applyFilterState(filters: FilterState): void {
    // Date range from shared filters
    if (filters.startDate && filters.endDate) {
      this.startDate = new Date(filters.startDate);
      this.endDate = new Date(filters.endDate);
    } else {
      // Fallback to existing logic if anything is missing
      this.timeRange = filters.timeRange;
      this.updateDateRange();
    }

    // Time range + centrale / équipement from shared filters
    this.timeRange = filters.timeRange;
    this.selectedCentrales = [...filters.centrales];
    this.selectedEquipements = [...filters.equipements];

    // Rebuild headers + timeline
    this.determineDisplayConfig();
    this.generateTimeSlots();
    this.generateGroupedHeaders();
    this.buildTimeline();
  }
}
