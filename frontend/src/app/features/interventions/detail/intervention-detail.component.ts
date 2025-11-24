import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../shared/material.module';
import { InterventionService } from '../../../core/services/intervention.service';
import { AuthService } from '../../../core/services/auth.service';
import { Intervention } from '../../../core/models/intervention.model';

@Component({
  selector: 'app-intervention-detail',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <div class="detail-container">
      <mat-toolbar>
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <span>Détail de l'Intervention</span>
        <span class="spacer"></span>
        @if (canWrite && intervention) {
          <button mat-raised-button color="primary" (click)="editIntervention()">
            <mat-icon>edit</mat-icon>
            Modifier
          </button>
        }
      </mat-toolbar>

      @if (intervention) {
        <div class="detail-content">
          <mat-card>
            <mat-card-header>
              <mat-card-title>{{ intervention.titre }}</mat-card-title>
              <mat-card-subtitle>
                Créé le {{ intervention.createdAt | date:'medium' }}
              </mat-card-subtitle>
            </mat-card-header>

            <mat-card-content>
              <div class="info-grid">
                <div class="info-item">
                  <strong>Centrale:</strong>
                  <span>{{ intervention.centrale }}</span>
                </div>

                <div class="info-item">
                  <strong>Équipement:</strong>
                  <span>{{ intervention.equipement }}</span>
                </div>

                <div class="info-item">
                  <strong>Type d'événement:</strong>
                  <mat-chip color="primary">{{ intervention.typeEvenement }}</mat-chip>
                </div>

                <div class="info-item">
                  <strong>Type de dysfonctionnement:</strong>
                  <span>{{ intervention.typeDysfonctionnement }}</span>
                </div>

                <div class="info-item">
                  <strong>Date de début:</strong>
                  <span>{{ intervention.dateDebut | date:'medium' }}</span>
                </div>

                @if (intervention.dateFin) {
                  <div class="info-item">
                    <strong>Date de fin:</strong>
                    <span>{{ intervention.dateFin | date:'medium' }}</span>
                  </div>
                }

                @if (intervention.dateIndisponibiliteDebut) {
                  <div class="info-item">
                    <strong>Indisponibilité début:</strong>
                    <span>{{ intervention.dateIndisponibiliteDebut | date:'medium' }}</span>
                  </div>
                }

                @if (intervention.dateIndisponibiliteFin) {
                  <div class="info-item">
                    <strong>Indisponibilité fin:</strong>
                    <span>{{ intervention.dateIndisponibiliteFin | date:'medium' }}</span>
                  </div>
                }

                @if (intervention.perteProduction) {
                  <div class="info-item">
                    <strong>Perte de production:</strong>
                    <span>{{ intervention.perteProduction }} kWh</span>
                  </div>
                }

                @if (intervention.perteCommunication) {
                  <div class="info-item">
                    <strong>Perte de communication:</strong>
                    <span>{{ intervention.perteCommunication }} heures</span>
                  </div>
                }

                <div class="info-item">
                  <strong>Statut:</strong>
                  <mat-chip [color]="intervention.isArchived ? 'accent' : 'primary'">
                    {{ intervention.isArchived ? 'Archivée' : 'Active' }}
                  </mat-chip>
                </div>
              </div>

              @if (intervention.commentaires) {
                <mat-divider class="my-3"></mat-divider>
                <div class="commentaires-section">
                  <h3>Commentaires</h3>
                  <p>{{ intervention.commentaires }}</p>
                </div>
              }

              @if (intervention.intervenants && intervention.intervenants.length > 0) {
                <mat-divider class="my-3"></mat-divider>
                <div class="intervenants-section">
                  <h3>Intervenants</h3>
                  <mat-list>
                    @for (intervenant of intervention.intervenants; track intervenant.id) {
                      <mat-list-item>
                        <mat-icon matListItemIcon>person</mat-icon>
                        <div matListItemTitle>{{ intervenant.nom }} {{ intervenant.prenom }}</div>
                        <div matListItemLine>
                          {{ intervenant.type }}
                          @if (intervenant.entreprise) { - {{ intervenant.entreprise }} }
                        </div>
                      </mat-list-item>
                    }
                  </mat-list>
                </div>
              }
            </mat-card-content>
          </mat-card>
        </div>
      } @else {
        <div class="loading">
          <mat-spinner></mat-spinner>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: #f5f5f5;
    }

    .detail-content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
      margin-top: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .info-item strong {
      color: #666;
      font-size: 14px;
    }

    .info-item span {
      font-size: 16px;
    }

    .commentaires-section,
    .intervenants-section {
      margin-top: 16px;
    }

    .commentaires-section h3,
    .intervenants-section h3 {
      margin-bottom: 12px;
      color: #333;
    }

    .commentaires-section p {
      white-space: pre-wrap;
      line-height: 1.6;
    }

    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }

    .my-3 {
      margin: 24px 0;
    }
  `]
})
export class InterventionDetailComponent implements OnInit {
  intervention: Intervention | null = null;
  canWrite = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private interventionService: InterventionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.canWrite = this.authService.canWrite();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadIntervention(id);
    }
  }

  loadIntervention(id: string): void {
    this.interventionService.getInterventionById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.intervention = response.data.intervention;
        }
      },
      error: (error) => {
        console.error('Error loading intervention:', error);
        this.goBack();
      }
    });
  }

  editIntervention(): void {
    if (this.intervention) {
      this.router.navigate(['/interventions', this.intervention.id, 'edit']);
    }
  }

  goBack(): void {
    this.router.navigate(['/interventions']);
  }
}
