import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MaterialModule } from '../../../shared/material.module';
import { InterventionService } from '../../../core/services/intervention.service';
import { PredefinedService } from '../../../core/services/predefined.service';
import { AuthService } from '../../../core/services/auth.service';
import { Intervention, InterventionFilters } from '../../../core/models/intervention.model';
import { PredefinedValuesMap, PredefinedType } from '../../../core/models/predefined.model';

@Component({
  selector: 'app-intervention-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  template: `
    <div class="list-container">
      <mat-toolbar>
        <span>Liste des Interventions</span>
        <span class="spacer"></span>
        <button mat-icon-button (click)="router.navigate(['/dashboard'])">
          <mat-icon>arrow_back</mat-icon>
        </button>
      </mat-toolbar>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <form [formGroup]="filterForm">
            <div class="filters-grid">
              <mat-form-field appearance="outline">
                <mat-label>Recherche</mat-label>
                <input matInput formControlName="search" placeholder="Rechercher...">
                <mat-icon matPrefix>search</mat-icon>
              </mat-form-field>

              @if (predefinedValues) {
                <mat-form-field appearance="outline">
                  <mat-label>Centrale</mat-label>
                  <mat-select formControlName="centrale">
                    <mat-option value="">Toutes</mat-option>
                    @for (value of predefinedValues[predefinedType.CENTRALE]; track value.id) {
                      <mat-option [value]="value.value">{{ value.value }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Type d'événement</mat-label>
                  <mat-select formControlName="typeEvenement">
                    <mat-option value="">Tous</mat-option>
                    @for (value of predefinedValues[predefinedType.TYPE_EVENEMENT]; track value.id) {
                      <mat-option [value]="value.value">{{ value.value }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              }

              <mat-form-field appearance="outline">
                <mat-label>Statut</mat-label>
                <mat-select formControlName="isArchived">
                  <mat-option [value]="false">Actives</mat-option>
                  <mat-option [value]="true">Archivées</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="filter-actions">
              <button mat-raised-button (click)="applyFilters()">
                <mat-icon>filter_list</mat-icon>
                Appliquer
              </button>
              <button mat-button (click)="resetFilters()">
                <mat-icon>clear</mat-icon>
                Réinitialiser
              </button>
              <button mat-raised-button color="accent" (click)="exportToCsv()">
                <mat-icon>download</mat-icon>
                Export CSV
              </button>
              @if (canWrite) {
                <button mat-raised-button color="primary" (click)="router.navigate(['/interventions/new'])">
                  <mat-icon>add</mat-icon>
                  Nouvelle Intervention
                </button>
              }
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Table -->
      <mat-card class="table-card">
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="dataSource" matSort>
              <ng-container matColumnDef="titre">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Titre</th>
                <td mat-cell *matCellDef="let row">{{ row.titre }}</td>
              </ng-container>

              <ng-container matColumnDef="centrale">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Centrale</th>
                <td mat-cell *matCellDef="let row">{{ row.centrale }}</td>
              </ng-container>

              <ng-container matColumnDef="equipement">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Équipement</th>
                <td mat-cell *matCellDef="let row">{{ row.equipement }}</td>
              </ng-container>

              <ng-container matColumnDef="typeEvenement">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Type</th>
                <td mat-cell *matCellDef="let row">
                  <mat-chip>{{ row.typeEvenement }}</mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="dateDebut">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Date Début</th>
                <td mat-cell *matCellDef="let row">{{ row.dateDebut | date:'short' }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button [matMenuTriggerFor]="menu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="viewDetail(row.id)">
                      <mat-icon>visibility</mat-icon>
                      Voir
                    </button>
                    @if (canWrite) {
                      <button mat-menu-item (click)="editIntervention(row.id)">
                        <mat-icon>edit</mat-icon>
                        Modifier
                      </button>
                      <button mat-menu-item (click)="archiveIntervention(row)">
                        <mat-icon>{{ row.isArchived ? 'unarchive' : 'archive' }}</mat-icon>
                        {{ row.isArchived ? 'Restaurer' : 'Archiver' }}
                      </button>
                      <button mat-menu-item (click)="deleteIntervention(row.id)">
                        <mat-icon>delete</mat-icon>
                        Supprimer
                      </button>
                    }
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>

          <mat-paginator [pageSizeOptions]="[10, 25, 50, 100]" showFirstLastButtons></mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .list-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: #f5f5f5;
    }

    .filters-card, .table-card {
      margin: 16px;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .filter-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .table-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .table-container {
      overflow-x: auto;
      flex: 1;
    }

    table {
      width: 100%;
    }

    mat-chip {
      font-size: 12px;
    }
  `]
})
export class InterventionListComponent implements OnInit {
  displayedColumns = ['titre', 'centrale', 'equipement', 'typeEvenement', 'dateDebut', 'actions'];
  dataSource: MatTableDataSource<Intervention> = new MatTableDataSource();
  filterForm: FormGroup;
  predefinedValues: PredefinedValuesMap | null = null;
  predefinedType = PredefinedType;
  canWrite = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private interventionService: InterventionService,
    private predefinedService: PredefinedService,
    private authService: AuthService,
    public router: Router
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      centrale: [''],
      typeEvenement: [''],
      isArchived: [false]
    });
  }

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
    const filters: InterventionFilters = {
      ...this.filterForm.value,
      page: 1,
      limit: 100
    };

    this.interventionService.getInterventions(filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.dataSource.data = response.data.interventions;
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        }
      }
    });
  }

  applyFilters(): void {
    this.loadInterventions();
  }

  resetFilters(): void {
    this.filterForm.reset({ isArchived: false });
    this.loadInterventions();
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
      next: () => this.loadInterventions()
    });
  }

  deleteIntervention(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette intervention ?')) {
      this.interventionService.deleteIntervention(id).subscribe({
        next: () => this.loadInterventions()
      });
    }
  }

  exportToCsv(): void {
    const filters: InterventionFilters = this.filterForm.value;
    this.interventionService.exportToCsv(filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `interventions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }
}
