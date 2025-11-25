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
                  <div class="chips-container">
                    @for (type of getTypeEvenementArray(); track type) {
                      <mat-chip color="primary">{{ type }}</mat-chip>
                    }
                  </div>
                </div>

                <div class="info-item">
                  <strong>Type de dysfonctionnement:</strong>
                  <div class="chips-container">
                    @for (type of getTypeDysfonctionnementArray(); track type) {
                      <mat-chip color="accent">{{ type }}</mat-chip>
                    }
                  </div>
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

                <div class="info-item">
                  <strong>Intervention réalisée:</strong>
                  <mat-chip [color]="intervention.hasIntervention ? 'primary' : ''">
                    {{ intervention.hasIntervention ? 'Oui' : 'Non' }}
                  </mat-chip>
                </div>

                <div class="info-item">
                  <strong>Perte de production:</strong>
                  <mat-chip [color]="intervention.hasPerteProduction ? 'warn' : ''">
                    {{ intervention.hasPerteProduction ? 'Oui' : 'Non' }}
                  </mat-chip>
                  @if (intervention.perteProduction) {
                    <span class="detail-text">{{ intervention.perteProduction }} kWh</span>
                  }
                </div>

                <div class="info-item">
                  <strong>Perte de communication:</strong>
                  <mat-chip [color]="intervention.hasPerteCommunication ? 'warn' : ''">
                    {{ intervention.hasPerteCommunication ? 'Oui' : 'Non' }}
                  </mat-chip>
                  @if (intervention.perteCommunication) {
                    <span class="detail-text">{{ intervention.perteCommunication }} heures</span>
                  }
                </div>

                <div class="info-item">
                  <strong>Rapport attendu:</strong>
                  <mat-chip [color]="intervention.rapportAttendu ? 'primary' : ''">
                    {{ intervention.rapportAttendu ? 'Oui' : 'Non' }}
                  </mat-chip>
                </div>

                <div class="info-item">
                  <strong>Rapport reçu:</strong>
                  <mat-chip [color]="intervention.rapportRecu ? 'primary' : ''">
                    {{ intervention.rapportRecu ? 'Oui' : 'Non' }}
                  </mat-chip>
                </div>

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

    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    .detail-text {
      font-size: 14px;
      color: #666;
      margin-top: 4px;
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
          
          // DEBUG: Log the raw intervention data
          console.log('🔍 [DETAIL] Raw intervention data:', this.intervention);
          console.log('🔍 [DETAIL] typeEvenement:', this.intervention.typeEvenement, typeof this.intervention.typeEvenement);
          console.log('🔍 [DETAIL] typeDysfonctionnement:', this.intervention.typeDysfonctionnement, typeof this.intervention.typeDysfonctionnement);
          console.log('🔍 [DETAIL] hasIntervention:', this.intervention.hasIntervention);
          console.log('🔍 [DETAIL] hasPerteProduction:', this.intervention.hasPerteProduction);
          console.log('🔍 [DETAIL] hasPerteCommunication:', this.intervention.hasPerteCommunication);
          console.log('🔍 [DETAIL] rapportAttendu:', this.intervention.rapportAttendu);
          console.log('🔍 [DETAIL] rapportRecu:', this.intervention.rapportRecu);
        }
      },
      error: (error) => {
        console.error('❌ [DETAIL] Error loading intervention:', error);
        this.goBack();
      }
    });
  }
  
  getTypeEvenementArray(): string[] {
    if (!this.intervention?.typeEvenement) return [];
    
    console.log('🔍 [DETAIL] getTypeEvenementArray called with:', this.intervention.typeEvenement);
    
    if (Array.isArray(this.intervention.typeEvenement)) {
      console.log('✅ [DETAIL] Already an array:', this.intervention.typeEvenement);
      return this.intervention.typeEvenement;
    }
    
    if (typeof this.intervention.typeEvenement === 'string') {
      try {
        const parsed = JSON.parse(this.intervention.typeEvenement);
        console.log('✅ [DETAIL] Parsed JSON:', parsed);
        return Array.isArray(parsed) ? parsed : [this.intervention.typeEvenement];
      } catch (e) {
        console.log('⚠️ [DETAIL] Parse failed, using as single value:', this.intervention.typeEvenement);
        return this.intervention.typeEvenement ? [this.intervention.typeEvenement] : [];
      }
    }
    
    return [];
  }
  
  getTypeDysfonctionnementArray(): string[] {
    if (!this.intervention?.typeDysfonctionnement) return [];
    
    console.log('🔍 [DETAIL] getTypeDysfonctionnementArray called with:', this.intervention.typeDysfonctionnement);
    
    if (Array.isArray(this.intervention.typeDysfonctionnement)) {
      console.log('✅ [DETAIL] Already an array:', this.intervention.typeDysfonctionnement);
      return this.intervention.typeDysfonctionnement;
    }
    
    if (typeof this.intervention.typeDysfonctionnement === 'string') {
      try {
        const parsed = JSON.parse(this.intervention.typeDysfonctionnement);
        console.log('✅ [DETAIL] Parsed JSON:', parsed);
        return Array.isArray(parsed) ? parsed : [this.intervention.typeDysfonctionnement];
      } catch (e) {
        console.log('⚠️ [DETAIL] Parse failed, using as single value:', this.intervention.typeDysfonctionnement);
        return this.intervention.typeDysfonctionnement ? [this.intervention.typeDysfonctionnement] : [];
      }
    }
    
    return [];
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
