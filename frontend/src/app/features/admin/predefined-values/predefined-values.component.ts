import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../shared/material.module';
import { PredefinedService } from '../../../core/services/predefined.service';
import { PredefinedValue, PredefinedType, PredefinedValuesMap } from '../../../core/models/predefined.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ValueDialogComponent } from './value-dialog.component';

@Component({
  selector: 'app-predefined-values',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  styleUrls: ['./predefined-values.component.scss'],
  template: `
    <div class="admin-container">
      <mat-toolbar color="primary">
        <button mat-icon-button (click)="router.navigate(['/dashboard'])">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <span>⚙️ Paramètres - Valeurs Prédéfinies</span>
      </mat-toolbar>

      <div class="admin-content">
        <mat-tab-group>
          <!-- Centrales Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">location_city</mat-icon>
              Centrales
            </ng-template>
            <div class="tab-content">
              <button mat-raised-button color="primary" class="add-button" (click)="openDialog(predefinedType.CENTRALE)">
                <mat-icon>add</mat-icon>
                Ajouter une centrale
              </button>
              
              @if (values[predefinedType.CENTRALE] && values[predefinedType.CENTRALE].length > 0) {
                <div class="value-grid">
                  @for (value of values[predefinedType.CENTRALE]; track value.id) {
                    <mat-card class="value-card">
                      <mat-card-header>
                        <mat-card-title>{{ value.value }}</mat-card-title>
                        @if (!value.isActive) {
                          <mat-chip class="inactive-chip">Inactif</mat-chip>
                        }
                      </mat-card-header>
                      <mat-card-content>
                        @if (value.description) {
                          <p class="description">{{ value.description }}</p>
                        }
                        <p class="equipment-count">{{ getEquipmentCount(value.id) }} équipement(s)</p>
                      </mat-card-content>
                      <mat-card-actions>
                        <button mat-icon-button (click)="openDialog(predefinedType.CENTRALE, value)" matTooltip="Modifier">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button color="warn" (click)="deleteValue(value)" matTooltip="Supprimer">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </mat-card-actions>
                    </mat-card>
                  }
                </div>
              } @else {
                <p class="empty-message">Aucune centrale configurée</p>
              }
            </div>
          </mat-tab>

          <!-- Équipements Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">settings</mat-icon>
              Équipements
            </ng-template>
            <div class="tab-content">
              <button mat-raised-button color="primary" class="add-button" (click)="openDialog(predefinedType.EQUIPEMENT)">
                <mat-icon>add</mat-icon>
                Ajouter un équipement
              </button>
              
              @if (values[predefinedType.EQUIPEMENT] && values[predefinedType.EQUIPEMENT].length > 0) {
                <div class="value-grid">
                  @for (value of values[predefinedType.EQUIPEMENT]; track value.id) {
                    <mat-card class="value-card">
                      <mat-card-header>
                        <mat-card-title>{{ value.value }}</mat-card-title>
                        @if (!value.isActive) {
                          <mat-chip class="inactive-chip">Inactif</mat-chip>
                        }
                      </mat-card-header>
                      <mat-card-content>
                        @if (value.description) {
                          <p class="description">{{ value.description }}</p>
                        }
                        @if (value.parentId) {
                          <p class="parent-info">📍 {{ getCentraleName(value.parentId) }}</p>
                        }
                      </mat-card-content>
                      <mat-card-actions>
                        <button mat-icon-button (click)="openDialog(predefinedType.EQUIPEMENT, value)" matTooltip="Modifier">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button color="warn" (click)="deleteValue(value)" matTooltip="Supprimer">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </mat-card-actions>
                    </mat-card>
                  }
                </div>
              } @else {
                <p class="empty-message">Aucun équipement configuré</p>
              }
            </div>
          </mat-tab>

          <!-- Types d'événements Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">event</mat-icon>
              Types d'événements
            </ng-template>
            <div class="tab-content">
              <button mat-raised-button color="primary" class="add-button" (click)="openDialog(predefinedType.TYPE_EVENEMENT)">
                <mat-icon>add</mat-icon>
                Ajouter un type
              </button>
              
              @if (values[predefinedType.TYPE_EVENEMENT] && values[predefinedType.TYPE_EVENEMENT].length > 0) {
                <div class="value-grid">
                  @for (value of values[predefinedType.TYPE_EVENEMENT]; track value.id) {
                    <mat-card class="value-card">
                      <mat-card-header>
                        <mat-card-title>{{ value.value }}</mat-card-title>
                        @if (!value.isActive) {
                          <mat-chip class="inactive-chip">Inactif</mat-chip>
                        }
                      </mat-card-header>
                      <mat-card-content>
                        @if (value.description) {
                          <p class="description">{{ value.description }}</p>
                        }
                      </mat-card-content>
                      <mat-card-actions>
                        <button mat-icon-button (click)="openDialog(predefinedType.TYPE_EVENEMENT, value)" matTooltip="Modifier">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button color="warn" (click)="deleteValue(value)" matTooltip="Supprimer">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </mat-card-actions>
                    </mat-card>
                  }
                </div>
              } @else {
                <p class="empty-message">Aucun type d'événement configuré</p>
              }
            </div>
          </mat-tab>

          <!-- Types de dysfonctionnements Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">warning</mat-icon>
              Dysfonctionnements
            </ng-template>
            <div class="tab-content">
              <button mat-raised-button color="primary" class="add-button" (click)="openDialog(predefinedType.TYPE_DYSFONCTIONNEMENT)">
                <mat-icon>add</mat-icon>
                Ajouter un type
              </button>
              
              @if (values[predefinedType.TYPE_DYSFONCTIONNEMENT] && values[predefinedType.TYPE_DYSFONCTIONNEMENT].length > 0) {
                <div class="value-grid">
                  @for (value of values[predefinedType.TYPE_DYSFONCTIONNEMENT]; track value.id) {
                    <mat-card class="value-card">
                      <mat-card-header>
                        <mat-card-title>{{ value.value }}</mat-card-title>
                        @if (!value.isActive) {
                          <mat-chip class="inactive-chip">Inactif</mat-chip>
                        }
                      </mat-card-header>
                      <mat-card-content>
                        @if (value.description) {
                          <p class="description">{{ value.description }}</p>
                        }
                      </mat-card-content>
                      <mat-card-actions>
                        <button mat-icon-button (click)="openDialog(predefinedType.TYPE_DYSFONCTIONNEMENT, value)" matTooltip="Modifier">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button color="warn" (click)="deleteValue(value)" matTooltip="Supprimer">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </mat-card-actions>
                    </mat-card>
                  }
                </div>
              } @else {
                <p class="empty-message">Aucun type de dysfonctionnement configuré</p>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `
})
export class PredefinedValuesComponent implements OnInit {
  values: PredefinedValuesMap = {} as PredefinedValuesMap;
  predefinedType = PredefinedType;

  constructor(
    private predefinedService: PredefinedService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadValues();
  }

  loadValues(): void {
    this.predefinedService.getAllValues().subscribe({
      next: (response) => {
        if (response.success) {
          this.values = response.data.values;
        }
      },
      error: () => {
        this.snackBar.open('Erreur de chargement', 'Fermer', { duration: 3000 });
      }
    });
  }

  openDialog(type: PredefinedType, value?: PredefinedValue): void {
    const dialogRef = this.dialog.open(ValueDialogComponent, {
      width: '500px',
      data: { value, type, allValues: this.values }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.id) {
          this.updateValue(result);
        } else {
          this.createValue(result);
        }
      }
    });
  }

  createValue(data: Partial<PredefinedValue>): void {
    this.predefinedService.createValue(data).subscribe({
      next: () => {
        this.snackBar.open('Valeur créée avec succès', 'Fermer', { duration: 3000 });
        this.loadValues();
      },
      error: () => {
        this.snackBar.open('Erreur lors de la création', 'Fermer', { duration: 3000 });
      }
    });
  }

  updateValue(data: PredefinedValue): void {
    this.predefinedService.updateValue(data.id, data).subscribe({
      next: () => {
        this.snackBar.open('Valeur modifiée avec succès', 'Fermer', { duration: 3000 });
        this.loadValues();
      },
      error: () => {
        this.snackBar.open('Erreur lors de la modification', 'Fermer', { duration: 3000 });
      }
    });
  }

  deleteValue(value: PredefinedValue): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${value.value}" ?`)) {
      this.predefinedService.deleteValue(value.id).subscribe({
        next: () => {
          this.snackBar.open('Valeur supprimée avec succès', 'Fermer', { duration: 3000 });
          this.loadValues();
        },
        error: () => {
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  getEquipmentCount(centraleId: string): number {
    return this.values[PredefinedType.EQUIPEMENT]?.filter(eq => eq.parentId === centraleId).length || 0;
  }

  getCentraleName(centraleId: string): string {
    return this.values[PredefinedType.CENTRALE]?.find(c => c.id === centraleId)?.value || 'Inconnue';
  }
}
