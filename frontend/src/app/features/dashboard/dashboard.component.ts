import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaterialModule } from '../../shared/material.module';
import { AuthService } from '../../core/services/auth.service';
import { InterventionService } from '../../core/services/intervention.service';
import { User } from '../../core/models/user.model';
import { InterventionStats } from '../../core/models/intervention.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <div class="dashboard-container">
      <!-- Toolbar -->
      <mat-toolbar color="primary">
        <span>Supervision - Gestion des Interventions</span>
        <span class="spacer"></span>
        @if (currentUser) {
          <button mat-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
            {{ currentUser.firstName }} {{ currentUser.lastName }}
          </button>
        }
        <mat-menu #userMenu="matMenu">
          <button mat-menu-item (click)="logout()">
            <mat-icon>exit_to_app</mat-icon>
            Déconnexion
          </button>
        </mat-menu>
      </mat-toolbar>

      <!-- Main Content -->
      <div class="dashboard-content">
        <div class="welcome-section">
          <h1>Tableau de Bord</h1>
          @if (currentUser) {
            <p>Bienvenue, {{ currentUser.firstName }} !</p>
          }
        </div>

        <!-- Stats Cards -->
        @if (stats) {
          <div class="stats-grid">
            <mat-card>
              <mat-card-content>
                <div class="stat-card">
                  <mat-icon color="primary">assignment</mat-icon>
                  <div>
                    <h2>{{ stats.total }}</h2>
                    <p>Total Interventions</p>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-content>
                <div class="stat-card">
                  <mat-icon color="accent">check_circle</mat-icon>
                  <div>
                    <h2>{{ stats.active }}</h2>
                    <p>Actives</p>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-content>
                <div class="stat-card">
                  <mat-icon>archive</mat-icon>
                  <div>
                    <h2>{{ stats.archived }}</h2>
                    <p>Archivées</p>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        }

        <!-- Quick Actions -->
        <div class="actions-section">
          <h2>Actions Rapides</h2>
          <div class="actions-grid">
            <mat-card class="action-card" (click)="navigateTo('/interventions')">
              <mat-card-content>
                <mat-icon>list</mat-icon>
                <h3>Voir les Interventions</h3>
                <p>Consulter la liste complète</p>
              </mat-card-content>
            </mat-card>

            @if (canWrite) {
              <mat-card class="action-card" (click)="navigateTo('/interventions/new')">
                <mat-card-content>
                  <mat-icon>add_circle</mat-icon>
                  <h3>Nouvelle Intervention</h3>
                  <p>Créer une intervention</p>
                </mat-card-content>
              </mat-card>
            }

            @if (isAdmin) {
              <mat-card class="action-card" (click)="navigateTo('/admin')">
                <mat-card-content>
                  <mat-icon>settings</mat-icon>
                  <h3>Administration</h3>
                  <p>Gérer les paramètres</p>
                </mat-card-content>
              </mat-card>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .dashboard-content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      background-color: #f5f5f5;
    }

    .welcome-section {
      margin-bottom: 32px;
    }

    .welcome-section h1 {
      font-size: 32px;
      font-weight: 500;
      margin: 0 0 8px 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-card mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .stat-card h2 {
      font-size: 36px;
      font-weight: 500;
      margin: 0;
    }

    .stat-card p {
      margin: 0;
      color: #666;
    }

    .actions-section h2 {
      font-size: 24px;
      font-weight: 500;
      margin-bottom: 16px;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
    }

    .action-card {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .action-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .action-card mat-card-content {
      text-align: center;
      padding: 24px;
    }

    .action-card mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #667eea;
    }

    .action-card h3 {
      margin: 16px 0 8px 0;
      font-size: 18px;
    }

    .action-card p {
      margin: 0;
      color: #666;
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  stats: InterventionStats | null = null;
  isAdmin = false;
  canWrite = false;

  constructor(
    private authService: AuthService,
    private interventionService: InterventionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAdmin = this.authService.isAdmin();
      this.canWrite = this.authService.canWrite();
      
      // Only load stats if user is authenticated
      if (user) {
        this.loadStats();
      }
    });
  }

  loadStats(): void {
    this.interventionService.getStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats = response.data.stats;
        }
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        // Even if the API call fails, clear local storage and redirect
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
