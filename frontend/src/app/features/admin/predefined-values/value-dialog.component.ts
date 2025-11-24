import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../../shared/material.module';
import { PredefinedValue, PredefinedType, PredefinedValuesMap } from '../../../core/models/predefined.model';

export interface ValueDialogData {
  value?: PredefinedValue;
  type: PredefinedType;
  allValues: PredefinedValuesMap;
}

@Component({
  selector: 'app-value-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  styleUrls: ['./value-dialog.component.scss'],
  template: `
    <h2 mat-dialog-title>{{ data.value ? 'Modifier' : 'Ajouter' }} {{ getTypeLabel() }}</h2>
    
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field class="full-width" appearance="outline">
          <mat-label>Nom *</mat-label>
          <input matInput formControlName="value" required>
          @if (form.get('value')?.hasError('required')) {
            <mat-error>Le nom est obligatoire</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="full-width" appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        @if (data.type === 'equipement') {
          <mat-form-field class="full-width" appearance="outline">
            <mat-label>Centrale associée *</mat-label>
            <mat-select formControlName="parentId" required>
              @for (centrale of data.allValues['centrale']; track centrale.id) {
                <mat-option [value]="centrale.id">{{ centrale.value }}</mat-option>
              }
            </mat-select>
            @if (form.get('parentId')?.hasError('required')) {
              <mat-error>La centrale est obligatoire</mat-error>
            }
          </mat-form-field>
        }

        <mat-form-field class="full-width" appearance="outline">
          <mat-label>Ordre d'affichage</mat-label>
          <input matInput type="number" formControlName="sortOrder" min="0">
        </mat-form-field>

        <mat-slide-toggle formControlName="isActive" color="primary">
          Actif
        </mat-slide-toggle>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="form.invalid">
        {{ data.value ? 'Enregistrer' : 'Créer' }}
      </button>
    </mat-dialog-actions>
  `
})
export class ValueDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ValueDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ValueDialogData
  ) {
    this.form = this.fb.group({
      value: [data.value?.value || '', Validators.required],
      description: [data.value?.description || ''],
      parentId: [data.value?.parentId || ''],
      sortOrder: [data.value?.sortOrder || 0],
      isActive: [data.value?.isActive !== false]
    });

    // Set parentId as required for equipment
    if (data.type === PredefinedType.EQUIPEMENT) {
      this.form.get('parentId')?.setValidators([Validators.required]);
    }
  }

  getTypeLabel(): string {
    const labels: Record<PredefinedType, string> = {
      [PredefinedType.CENTRALE]: 'une Centrale',
      [PredefinedType.EQUIPEMENT]: 'un Équipement',
      [PredefinedType.TYPE_EVENEMENT]: 'un Type d\'événement',
      [PredefinedType.TYPE_DYSFONCTIONNEMENT]: 'un Type de dysfonctionnement',
      [PredefinedType.TYPE_INTERVENANT]: 'un Type d\'intervenant'
    };
    return labels[this.data.type] || '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.valid) {
      const result = {
        ...this.data.value,
        ...this.form.value,
        type: this.data.type
      };
      this.dialogRef.close(result);
    }
  }
}
