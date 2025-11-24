import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../shared/material.module';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <div class="admin-container">
      <mat-toolbar>
        <button mat-icon-button (click)="router.navigate(['/dashboard'])">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <span>Gestion des Utilisateurs</span>
      </mat-toolbar>

      <div class="admin-content">
        <mat-card>
          <mat-card-content>
            <p>Cette fonctionnalité sera implémentée prochainement.</p>
            <button mat-raised-button color="primary" (click)="router.navigate(['/dashboard'])">
              Retour au tableau de bord
            </button>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: #f5f5f5;
    }

    .admin-content {
      flex: 1;
      padding: 24px;
    }
  `]
})
export class UsersComponent {
  constructor(public router: Router) {}
}
