import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../shared/material.module';
import { FormsModule } from '@angular/forms';
import { IntervenantService } from '../../../core/services/intervenant.service';
import { CompanyService } from '../../../core/services/company.service';
import { Intervenant } from '../../../core/models/intervenant.model';
import { Company } from '../../../core/models/company.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-intervenants-companies',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule],
  styleUrls: ['./intervenants-companies.component.scss'],
  templateUrl: './intervenants-companies.component.html'
})
export class IntervenantsCompaniesComponent implements OnInit {
  intervenants: Intervenant[] = [];
  companies: Company[] = [];
  
  // New row templates
  newIntervenant: Partial<Intervenant> = {
    name: '',
    surname: '',
    phone: '',
    country: '',
    companyId: '',
    isActive: true
  };
  
  newCompany: Partial<Company> = {
    name: '',
    isActive: true
  };
  
  editingIntervenantId: string | null = null;
  editingCompanyId: string | null = null;

  constructor(
    private intervenantService: IntervenantService,
    private companyService: CompanyService,
    private snackBar: MatSnackBar,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loadIntervenants();
    this.loadCompanies();
  }

  loadIntervenants(): void {
    this.intervenantService.getIntervenants({ page: 1, limit: 1000 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.intervenants = response.data.intervenants;
        }
      },
      error: () => {
        this.snackBar.open('Erreur de chargement des intervenants', 'Fermer', { duration: 3000 });
      }
    });
  }

  loadCompanies(): void {
    this.companyService.getCompanies({ page: 1, limit: 1000 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.companies = response.data.companies;
        }
      },
      error: () => {
        this.snackBar.open('Erreur de chargement des entreprises', 'Fermer', { duration: 3000 });
      }
    });
  }

  addIntervenant(): void {
    if (!this.newIntervenant.name || !this.newIntervenant.surname || !this.newIntervenant.phone) {
      this.snackBar.open('Nom, prénom et téléphone sont requis', 'Fermer', { duration: 3000 });
      return;
    }

    this.intervenantService.createIntervenant(this.newIntervenant).subscribe({
      next: (response) => {
        if (response.success) {
          this.intervenants.push(response.data.intervenant);
          this.newIntervenant = { name: '', surname: '', phone: '', country: '', companyId: '', isActive: true };
          this.snackBar.open('Intervenant ajouté', 'Fermer', { duration: 2000 });
        }
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'ajout', 'Fermer', { duration: 3000 });
      }
    });
  }

  updateIntervenant(intervenant: Intervenant): void {
    this.intervenantService.updateIntervenant(intervenant.id, intervenant).subscribe({
      next: (response) => {
        if (response.success) {
          this.editingIntervenantId = null;
          this.snackBar.open('Intervenant modifié', 'Fermer', { duration: 2000 });
        }
      },
      error: () => {
        this.snackBar.open('Erreur lors de la modification', 'Fermer', { duration: 3000 });
      }
    });
  }

  deleteIntervenant(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet intervenant ?')) {
      this.intervenantService.deleteIntervenant(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.intervenants = this.intervenants.filter(i => i.id !== id);
            this.snackBar.open('Intervenant supprimé', 'Fermer', { duration: 2000 });
          }
        },
        error: () => {
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  addCompany(): void {
    if (!this.newCompany.name) {
      this.snackBar.open('Le nom est requis', 'Fermer', { duration: 3000 });
      return;
    }

    this.companyService.createCompany(this.newCompany).subscribe({
      next: (response) => {
        if (response.success) {
          this.companies.push(response.data.company);
          this.newCompany = { name: '', isActive: true };
          this.snackBar.open('Entreprise ajoutée', 'Fermer', { duration: 2000 });
        }
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'ajout', 'Fermer', { duration: 3000 });
      }
    });
  }

  updateCompany(company: Company): void {
    this.companyService.updateCompany(company.id, company).subscribe({
      next: (response) => {
        if (response.success) {
          this.editingCompanyId = null;
          this.snackBar.open('Entreprise modifiée', 'Fermer', { duration: 2000 });
        }
      },
      error: () => {
        this.snackBar.open('Erreur lors de la modification', 'Fermer', { duration: 3000 });
      }
    });
  }

  deleteCompany(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) {
      this.companyService.deleteCompany(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.companies = this.companies.filter(c => c.id !== id);
            this.snackBar.open('Entreprise supprimée', 'Fermer', { duration: 2000 });
          }
        },
        error: () => {
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  startEditIntervenant(id: string): void {
    this.editingIntervenantId = id;
  }

  startEditCompany(id: string): void {
    this.editingCompanyId = id;
  }

  cancelEdit(): void {
    this.editingIntervenantId = null;
    this.editingCompanyId = null;
    this.loadData();
  }

  getCompanyName(companyId?: string): string {
    if (!companyId) return '-';
    const company = this.companies.find(c => c.id === companyId);
    return company ? company.name : '-';
  }
}
