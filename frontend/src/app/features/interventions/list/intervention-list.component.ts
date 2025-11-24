import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MaterialModule } from '../../../shared/material.module';
import { InterventionService } from '../../../core/services/intervention.service';
import { PredefinedService } from '../../../core/services/predefined.service';
import { AuthService } from '../../../core/services/auth.service';
import { Intervention, InterventionFilters } from '../../../core/models/intervention.model';
import { PredefinedValuesMap, PredefinedType } from '../../../core/models/predefined.model';
import { MatSnackBar } from '@angular/material/snack-bar';

interface ColumnFilter {
  field: string;
  label: string;
  values: string[];
  selectedValues: string[];
  control: FormControl;
}

@Component({
  selector: 'app-intervention-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './intervention-list.component.html',
  styleUrls: ['./intervention-list.component.scss']
})
export class InterventionListComponent implements OnInit {
  displayedColumns = ['titre', 'centrale', 'equipement', 'typeEvenement', 'typeDysfonctionnement', 'dateDebut', 'dateFin', 'statut', 'actions'];
  dataSource: MatTableDataSource<Intervention> = new MatTableDataSource();
  allInterventions: Intervention[] = [];
  
  predefinedValues: PredefinedValuesMap | null = null;
  predefinedType = PredefinedType;
  canWrite = false;

  // Column filters
  columnFilters: Map<string, ColumnFilter> = new Map();
  activeFiltersCount = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private interventionService: InterventionService,
    private predefinedService: PredefinedService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.canWrite = this.authService.canWrite();
    this.loadPredefinedValues();
    this.loadInterventions();
  }

  loadPredefinedValues(): void {
    this.predefinedService.getAllValues().subscribe({
      next: (response) => {
        if (response.success) {
          this.predefinedValues = response.data.values;
        }
      }
    });
  }

  loadInterventions(): void {
    this.interventionService.getInterventions({ page: 1, limit: 1000 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.allInterventions = response.data.interventions;
          this.dataSource.data = this.allInterventions;
          
          // Setup table features
          setTimeout(() => {
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.setupColumnFilters();
          });
        }
      },
      error: (error) => {
        this.snackBar.open('Erreur lors du chargement des interventions', 'Fermer', { duration: 3000 });
      }
    });
  }

  setupColumnFilters(): void {
    const columns = [
      { field: 'titre', label: 'Titre' },
      { field: 'centrale', label: 'Centrale' },
      { field: 'equipement', label: 'Équipement' },
      { field: 'typeEvenement', label: 'Type Événement' },
      { field: 'typeDysfonctionnement', label: 'Type Dysfonctionnement' },
    ];

    columns.forEach(col => {
      const uniqueValues = [...new Set(
        this.allInterventions
          .map(i => (i as any)[col.field])
          .filter(v => v)
      )].sort();

      const control = new FormControl([]);
      control.valueChanges.subscribe(() => this.applyColumnFilters());

      this.columnFilters.set(col.field, {
        field: col.field,
        label: col.label,
        values: uniqueValues,
        selectedValues: [],
        control
      });
    });
  }

  applyColumnFilters(): void {
    let filteredData = [...this.allInterventions];
    this.activeFiltersCount = 0;

    this.columnFilters.forEach((filter) => {
      const selectedValues = filter.control.value || [];
      if (selectedValues.length > 0) {
        this.activeFiltersCount++;
        filteredData = filteredData.filter(intervention => 
          selectedValues.includes((intervention as any)[filter.field])
        );
      }
    });

    this.dataSource.data = filteredData;
  }

  clearAllFilters(): void {
    this.columnFilters.forEach(filter => {
      filter.control.setValue([]);
    });
    this.activeFiltersCount = 0;
    this.dataSource.data = this.allInterventions;
    this.snackBar.open('Filtres réinitialisés', 'Fermer', { duration: 2000 });
  }

  getColumnFilter(field: string): ColumnFilter | undefined {
    return this.columnFilters.get(field);
  }

  isColumnFiltered(field: string): boolean {
    const filter = this.columnFilters.get(field);
    return filter ? (filter.control.value?.length || 0) > 0 : false;
  }

  viewDetail(id: string): void {
    this.router.navigate(['/interventions', id]);
  }

  editIntervention(id: string): void {
    this.router.navigate(['/interventions', id, 'edit']);
  }

  archiveIntervention(intervention: Intervention): void {
    const action = intervention.isArchived ? 
      this.interventionService.restoreIntervention(intervention.id) :
      this.interventionService.archiveIntervention(intervention.id);

    action.subscribe({
      next: () => {
        this.snackBar.open(
          intervention.isArchived ? 'Intervention restaurée' : 'Intervention archivée',
          'Fermer',
          { duration: 2000 }
        );
        this.loadInterventions();
      }
    });
  }

  deleteIntervention(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette intervention ? Cette action est irréversible.')) {
      this.interventionService.deleteIntervention(id).subscribe({
        next: () => {
          this.snackBar.open('Intervention supprimée', 'Fermer', { duration: 2000 });
          this.loadInterventions();
        }
      });
    }
  }

  exportToCsv(): void {
    const filters: InterventionFilters = {};
    this.interventionService.exportToCsv(filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `interventions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Export CSV téléchargé', 'Fermer', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'export', 'Fermer', { duration: 3000 });
      }
    });
  }

  getStatutLabel(intervention: Intervention): string {
    if (intervention.isArchived) return 'Archivée';
    if (intervention.dateFin) return 'Terminée';
    return 'En cours';
  }

  getStatutColor(intervention: Intervention): string {
    if (intervention.isArchived) return 'archived';
    if (intervention.dateFin) return 'completed';
    return 'ongoing';
  }
}
