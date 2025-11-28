import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../shared/material.module';
import { FormsModule } from '@angular/forms';
import { PredefinedService } from '../../../core/services/predefined.service';
import { IntervenantService } from '../../../core/services/intervenant.service';
import { CompanyService } from '../../../core/services/company.service';
import { PredefinedValue, PredefinedType } from '../../../core/models/predefined.model';
import { Intervenant } from '../../../core/models/intervenant.model';
import { Company } from '../../../core/models/company.model';
import { MatSnackBar } from '@angular/material/snack-bar';

interface TableRow {
  id?: string;
  [key: string]: any;
  isEditing?: boolean;
  isNew?: boolean;
}

@Component({
  selector: 'app-predefined-values',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule],
  templateUrl: './predefined-values.component.html',
  styleUrls: ['./predefined-values.component.scss']
})
export class PredefinedValuesComponent implements OnInit {
  // Data arrays
  centrales: TableRow[] = [];
  equipements: TableRow[] = [];
  typesEvenements: TableRow[] = [];
  dysfonctionnements: TableRow[] = [];
  intervenants: TableRow[] = [];
  companies: TableRow[] = [];
  
  // Search filters
  searchCentrale = '';
  searchEquipement = '';
  searchTypeEvenement = '';
  searchDysfonctionnement = '';
  searchIntervenant = '';
  searchCompany = '';
  
  // New row templates
  newCentrale: TableRow = { value: '', nickname: '', isNew: true };
  newEquipement: TableRow = { value: '', parentId: '', equipmentType: '', isNew: true };
  newTypeEvenement: TableRow = { value: '', isNew: true };
  newDysfonctionnement: TableRow = { value: '', isNew: true };
  newIntervenant: TableRow = { name: '', surname: '', phone: '', companyId: '', isNew: true };
  newCompany: TableRow = { name: '', isNew: true };

  constructor(
    private predefinedService: PredefinedService,
    private intervenantService: IntervenantService,
    private companyService: CompanyService,
    private snackBar: MatSnackBar,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loadPredefinedValues();
    this.loadIntervenants();
    this.loadCompanies();
  }

  loadPredefinedValues(): void {
    this.predefinedService.getAllValues().subscribe({
      next: (response) => {
        if (response.success) {
          this.centrales = (response.data.values.centrale || []).map(v => ({ ...v, isEditing: false }));
          this.equipements = (response.data.values.equipement || []).map(v => ({ ...v, isEditing: false }));
          this.typesEvenements = (response.data.values.type_evenement || []).map(v => ({ ...v, isEditing: false }));
          this.dysfonctionnements = (response.data.values.type_dysfonctionnement || []).map(v => ({ ...v, isEditing: false }));
        }
      },
      error: () => {
        this.snackBar.open('Erreur de chargement des valeurs prédéfinies', 'Fermer', { duration: 3000 });
      }
    });
  }

  loadIntervenants(): void {
    this.intervenantService.getIntervenants({ page: 1, limit: 1000 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.intervenants = response.data.intervenants.map(i => ({ ...i, isEditing: false }));
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
          this.companies = response.data.companies.map(c => ({ ...c, isEditing: false }));
        }
      },
      error: () => {
        this.snackBar.open('Erreur de chargement des entreprises', 'Fermer', { duration: 3000 });
      }
    });
  }

  // Centrale methods
  addCentrale(): void {
    if (!this.newCentrale['value']) {
      this.snackBar.open('Le nom de la centrale est requis', 'Fermer', { duration: 3000 });
      return;
    }

    const data = {
      type: PredefinedType.CENTRALE,
      value: this.newCentrale['value'],
      nickname: this.newCentrale['nickname'] || undefined
    };

    this.predefinedService.createValue(data).subscribe({
      next: (response) => {
        if (response.success) {
          this.centrales.push({ ...response.data.value, isEditing: false });
          this.newCentrale = { value: '', nickname: '', isNew: true };
          this.snackBar.open('Centrale ajoutée', 'Fermer', { duration: 2000 });
        }
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'ajout', 'Fermer', { duration: 3000 });
      }
    });
  }

  updateCentrale(centrale: TableRow): void {
    this.predefinedService.updateValue(centrale.id!, centrale).subscribe({
      next: () => {
        centrale.isEditing = false;
        this.snackBar.open('Centrale modifiée', 'Fermer', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Erreur lors de la modification', 'Fermer', { duration: 3000 });
      }
    });
  }

  deleteCentrale(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette centrale ?')) {
      this.predefinedService.deleteValue(id).subscribe({
        next: () => {
          this.centrales = this.centrales.filter(c => c.id !== id);
          this.snackBar.open('Centrale supprimée', 'Fermer', { duration: 2000 });
        },
        error: () => {
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  // Équipement methods
  addEquipement(): void {
    if (!this.newEquipement['value'] || !this.newEquipement['parentId']) {
      this.snackBar.open('Le nom et la centrale sont requis', 'Fermer', { duration: 3000 });
      return;
    }

    const data = {
      type: PredefinedType.EQUIPEMENT,
      value: this.newEquipement['value'],
      parentId: this.newEquipement['parentId'],
      equipmentType: this.newEquipement['equipmentType'] || undefined
    };

    this.predefinedService.createValue(data).subscribe({
      next: (response) => {
        if (response.success) {
          this.equipements.push({ ...response.data.value, isEditing: false });
          this.newEquipement = { value: '', parentId: '', equipmentType: '', isNew: true };
          this.snackBar.open('Équipement ajouté', 'Fermer', { duration: 2000 });
        }
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'ajout', 'Fermer', { duration: 3000 });
      }
    });
  }

  updateEquipement(equipement: TableRow): void {
    this.predefinedService.updateValue(equipement.id!, equipement).subscribe({
      next: () => {
        equipement.isEditing = false;
        this.snackBar.open('Équipement modifié', 'Fermer', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Erreur lors de la modification', 'Fermer', { duration: 3000 });
      }
    });
  }

  deleteEquipement(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet équipement ?')) {
      this.predefinedService.deleteValue(id).subscribe({
        next: () => {
          this.equipements = this.equipements.filter(e => e.id !== id);
          this.snackBar.open('Équipement supprimé', 'Fermer', { duration: 2000 });
        },
        error: () => {
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  // Type Événement methods
  addTypeEvenement(): void {
    if (!this.newTypeEvenement['value']) {
      this.snackBar.open('Le titre est requis', 'Fermer', { duration: 3000 });
      return;
    }

    const data = {
      type: PredefinedType.TYPE_EVENEMENT,
      value: this.newTypeEvenement['value']
    };

    this.predefinedService.createValue(data).subscribe({
      next: (response) => {
        if (response.success) {
          this.typesEvenements.push({ ...response.data.value, isEditing: false });
          this.newTypeEvenement = { value: '', isNew: true };
          this.snackBar.open('Type d\'événement ajouté', 'Fermer', { duration: 2000 });
        }
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'ajout', 'Fermer', { duration: 3000 });
      }
    });
  }

  updateTypeEvenement(type: TableRow): void {
    this.predefinedService.updateValue(type.id!, type).subscribe({
      next: () => {
        type.isEditing = false;
        this.snackBar.open('Type d\'événement modifié', 'Fermer', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Erreur lors de la modification', 'Fermer', { duration: 3000 });
      }
    });
  }

  deleteTypeEvenement(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce type d\'événement ?')) {
      this.predefinedService.deleteValue(id).subscribe({
        next: () => {
          this.typesEvenements = this.typesEvenements.filter(t => t.id !== id);
          this.snackBar.open('Type d\'événement supprimé', 'Fermer', { duration: 2000 });
        },
        error: () => {
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  // Dysfonctionnement methods
  addDysfonctionnement(): void {
    if (!this.newDysfonctionnement['value']) {
      this.snackBar.open('Le titre est requis', 'Fermer', { duration: 3000 });
      return;
    }

    const data = {
      type: PredefinedType.TYPE_DYSFONCTIONNEMENT,
      value: this.newDysfonctionnement['value']
    };

    this.predefinedService.createValue(data).subscribe({
      next: (response) => {
        if (response.success) {
          this.dysfonctionnements.push({ ...response.data.value, isEditing: false });
          this.newDysfonctionnement = { value: '', isNew: true };
          this.snackBar.open('Dysfonctionnement ajouté', 'Fermer', { duration: 2000 });
        }
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'ajout', 'Fermer', { duration: 3000 });
      }
    });
  }

  updateDysfonctionnement(dysfonctionnement: TableRow): void {
    this.predefinedService.updateValue(dysfonctionnement.id!, dysfonctionnement).subscribe({
      next: () => {
        dysfonctionnement.isEditing = false;
        this.snackBar.open('Dysfonctionnement modifié', 'Fermer', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Erreur lors de la modification', 'Fermer', { duration: 3000 });
      }
    });
  }

  deleteDysfonctionnement(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce dysfonctionnement ?')) {
      this.predefinedService.deleteValue(id).subscribe({
        next: () => {
          this.dysfonctionnements = this.dysfonctionnements.filter(d => d.id !== id);
          this.snackBar.open('Dysfonctionnement supprimé', 'Fermer', { duration: 2000 });
        },
        error: () => {
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  // Intervenant methods (from previous implementation)
  addIntervenant(): void {
    if (!this.newIntervenant['name'] || !this.newIntervenant['surname'] || !this.newIntervenant['phone']) {
      this.snackBar.open('Nom, prénom et téléphone sont requis', 'Fermer', { duration: 3000 });
      return;
    }

    this.intervenantService.createIntervenant(this.newIntervenant).subscribe({
      next: (response) => {
        if (response.success) {
          this.intervenants.push({ ...response.data.intervenant, isEditing: false });
          this.newIntervenant = { name: '', surname: '', phone: '', companyId: '', isNew: true };
          this.snackBar.open('Intervenant ajouté', 'Fermer', { duration: 2000 });
        }
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'ajout', 'Fermer', { duration: 3000 });
      }
    });
  }

  updateIntervenant(intervenant: TableRow): void {
    this.intervenantService.updateIntervenant(intervenant.id!, intervenant).subscribe({
      next: () => {
        intervenant.isEditing = false;
        this.snackBar.open('Intervenant modifié', 'Fermer', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Erreur lors de la modification', 'Fermer', { duration: 3000 });
      }
    });
  }

  deleteIntervenant(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet intervenant ?')) {
      this.intervenantService.deleteIntervenant(id).subscribe({
        next: () => {
          this.intervenants = this.intervenants.filter(i => i.id !== id);
          this.snackBar.open('Intervenant supprimé', 'Fermer', { duration: 2000 });
        },
        error: () => {
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  // Company methods (from previous implementation)
  addCompany(): void {
    if (!this.newCompany['name']) {
      this.snackBar.open('Le nom est requis', 'Fermer', { duration: 3000 });
      return;
    }

    this.companyService.createCompany(this.newCompany).subscribe({
      next: (response) => {
        if (response.success) {
          this.companies.push({ ...response.data.company, isEditing: false });
          this.newCompany = { name: '', isNew: true };
          this.snackBar.open('Entreprise ajoutée', 'Fermer', { duration: 2000 });
        }
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'ajout', 'Fermer', { duration: 3000 });
      }
    });
  }

  updateCompany(company: TableRow): void {
    this.companyService.updateCompany(company.id!, company).subscribe({
      next: () => {
        company.isEditing = false;
        this.snackBar.open('Entreprise modifiée', 'Fermer', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Erreur lors de la modification', 'Fermer', { duration: 3000 });
      }
    });
  }

  deleteCompany(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) {
      this.companyService.deleteCompany(id).subscribe({
        next: () => {
          this.companies = this.companies.filter(c => c.id !== id);
          this.snackBar.open('Entreprise supprimée', 'Fermer', { duration: 2000 });
        },
        error: () => {
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  // Utility methods
  startEdit(row: TableRow): void {
    row.isEditing = true;
  }

  cancelEdit(row: TableRow): void {
    row.isEditing = false;
    this.loadAllData(); // Reload to reset changes
  }

  getCentraleName(centraleId: string): string {
    const centrale = this.centrales.find(c => c['id'] === centraleId);
    return centrale ? centrale['value'] : '-';
  }

  getCompanyName(companyId: string): string {
    const company = this.companies.find(c => c['id'] === companyId);
    return company ? company['name'] : '-';
  }

  // Filter methods
  get filteredCentrales() {
    return this.centrales.filter(c => 
      c['value']?.toLowerCase().includes(this.searchCentrale.toLowerCase()) ||
      c['nickname']?.toLowerCase().includes(this.searchCentrale.toLowerCase())
    );
  }

  get filteredEquipements() {
    return this.equipements.filter(e => 
      e['value']?.toLowerCase().includes(this.searchEquipement.toLowerCase()) ||
      e['equipmentType']?.toLowerCase().includes(this.searchEquipement.toLowerCase())
    );
  }

  get filteredTypesEvenements() {
    return this.typesEvenements.filter(t => 
      t['value']?.toLowerCase().includes(this.searchTypeEvenement.toLowerCase())
    );
  }

  get filteredDysfonctionnements() {
    return this.dysfonctionnements.filter(d => 
      d['value']?.toLowerCase().includes(this.searchDysfonctionnement.toLowerCase())
    );
  }

  get filteredIntervenants() {
    return this.intervenants.filter(i => 
      i['name']?.toLowerCase().includes(this.searchIntervenant.toLowerCase()) ||
      i['surname']?.toLowerCase().includes(this.searchIntervenant.toLowerCase())
    );
  }

  get filteredCompanies() {
    return this.companies.filter(c => 
      c['name']?.toLowerCase().includes(this.searchCompany.toLowerCase())
    );
  }
}
