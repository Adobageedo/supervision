import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../shared/material.module';
import { InterventionService } from '../../../core/services/intervention.service';
import { PredefinedService } from '../../../core/services/predefined.service';
import { Intervention } from '../../../core/models/intervention.model';
import { PredefinedValuesMap, PredefinedType, PredefinedValue } from '../../../core/models/predefined.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-intervention-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  styleUrls: ['./intervention-form.component.scss'],
  template: `
    <div class="form-container">
      <mat-toolbar color="primary">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <span>
          {{ isEditMode ? 'Modifier' : 'Nouvelle' }} Intervention
          @if (isEditMode && originalTitle) {
            <span class="original-title"> - {{ originalTitle }}</span>
          }
        </span>
      </mat-toolbar>

      <div class="form-content">
        <mat-card>
          <mat-card-content>
            <form [formGroup]="interventionForm" (ngSubmit)="onSubmit()">
              
              <!-- Section 1: Informations de base -->
              <div class="form-section">
                <h3><mat-icon>event</mat-icon> Informations de l'événement</h3>
                
                <mat-form-field class="full-width" appearance="outline">
                  <mat-label>Titre Événement *</mat-label>
                  <input matInput formControlName="titreEvenement" required>
                  @if (interventionForm.get('titreEvenement')?.hasError('required')) {
                    <mat-error>Le titre est obligatoire</mat-error>
                  }
                </mat-form-field>

                <mat-form-field class="full-width" appearance="outline">
                  <mat-label>Date Référence *</mat-label>
                  <input matInput [matDatepicker]="pickerRef" formControlName="dateRef" required>
                  <mat-datepicker-toggle matSuffix [for]="pickerRef"></mat-datepicker-toggle>
                  <mat-datepicker #pickerRef></mat-datepicker>
                  <mat-hint>Par défaut: aujourd'hui</mat-hint>
                </mat-form-field>

                @if (predefinedValues) {
                  <div class="two-column-layout">
                    <div class="column-left">
                      <mat-form-field class="full-width" appearance="outline">
                        <mat-label>Centrale *</mat-label>
                        <mat-select formControlName="centrale" required>
                          @for (value of predefinedValues[predefinedType.CENTRALE]; track value.id) {
                            <mat-option [value]="value.value">{{ value.value }}</mat-option>
                          }
                        </mat-select>
                        @if (interventionForm.get('centrale')?.hasError('required')) {
                          <mat-error>La centrale est obligatoire</mat-error>
                        }
                      </mat-form-field>

                      <mat-form-field class="full-width" appearance="outline">
                        <mat-label>Type Événement</mat-label>
                        <mat-select formControlName="typeEvenement" multiple>
                          @for (value of predefinedValues[predefinedType.TYPE_EVENEMENT]; track value.id) {
                            <mat-option [value]="value.value">{{ value.value }}</mat-option>
                          }
                        </mat-select>
                        <mat-hint>Sélection multiple possible</mat-hint>
                      </mat-form-field>
                    </div>

                    <div class="column-right">
                      <mat-form-field class="full-width" appearance="outline">
                        <mat-label>Équipement *</mat-label>
                        <mat-select formControlName="equipement" required [disabled]="!interventionForm.get('centrale')?.value">
                          @if (filteredEquipements.length === 0 && interventionForm.get('centrale')?.value) {
                            <mat-option disabled>Aucun équipement pour cette centrale</mat-option>
                          }
                          @for (value of filteredEquipements; track value.id) {
                            <mat-option [value]="value.value">{{ value.value }}</mat-option>
                          }
                        </mat-select>
                        @if (interventionForm.get('equipement')?.hasError('required')) {
                          <mat-error>L'équipement est obligatoire</mat-error>
                        }
                        @if (!interventionForm.get('centrale')?.value) {
                          <mat-hint>Sélectionnez d'abord une centrale</mat-hint>
                        }
                      </mat-form-field>

                      <mat-form-field class="full-width" appearance="outline">
                        <mat-label>Type Dysfonctionnement</mat-label>
                        <mat-select formControlName="typeDysfonctionnement" multiple>
                          @for (value of predefinedValues[predefinedType.TYPE_DYSFONCTIONNEMENT]; track value.id) {
                            <mat-option [value]="value.value">{{ value.value }}</mat-option>
                          }
                        </mat-select>
                        <mat-hint>Sélection multiple possible</mat-hint>
                      </mat-form-field>
                    </div>
                  </div>
                }
              </div>

              <!-- Section 2: Intervention -->
              <div class="form-section">
                <h3><mat-icon>build</mat-icon> Intervention</h3>
                
                <mat-slide-toggle formControlName="hasIntervention" color="primary">
                  Intervention réalisée ?
                </mat-slide-toggle>

                @if (interventionForm.get('hasIntervention')?.value) {
                  <div class="conditional-section">
                    <mat-form-field class="full-width" appearance="outline">
                      <mat-label>Intervenant Enregistré *</mat-label>
                      <input matInput formControlName="intervenantEnregistre">
                    </mat-form-field>

                    <div class="two-column-layout">
                      <div class="column-left">
                        <mat-form-field class="full-width" appearance="outline">
                          <mat-label>Date Début Intervention *</mat-label>
                          <input matInput [matDatepicker]="pickerDebutInter" formControlName="dateDebutIntervention">
                          <mat-datepicker-toggle matSuffix [for]="pickerDebutInter"></mat-datepicker-toggle>
                          <mat-datepicker #pickerDebutInter></mat-datepicker>
                        </mat-form-field>
                      </div>

                      <div class="column-right">
                        <mat-form-field class="full-width" appearance="outline">
                          <mat-label>Heure Début *</mat-label>
                          <input matInput type="time" formControlName="heureDebutIntervention">
                          <mat-icon matSuffix>schedule</mat-icon>
                        </mat-form-field>
                      </div>
                    </div>

                    <mat-slide-toggle formControlName="interventionTerminee" color="primary">
                      Intervention Terminée ?
                    </mat-slide-toggle>

                    @if (interventionForm.get('interventionTerminee')?.value) {
                      <div class="two-column-layout">
                        <div class="column-left">
                          <mat-form-field class="full-width" appearance="outline">
                            <mat-label>Date Fin Intervention *</mat-label>
                            <input matInput [matDatepicker]="pickerFinInter" formControlName="dateFinIntervention">
                            <mat-datepicker-toggle matSuffix [for]="pickerFinInter"></mat-datepicker-toggle>
                            <mat-datepicker #pickerFinInter></mat-datepicker>
                          </mat-form-field>
                        </div>

                        <div class="column-right">
                          <mat-form-field class="full-width" appearance="outline">
                            <mat-label>Heure Fin *</mat-label>
                            <input matInput type="time" formControlName="heureFinIntervention">
                            <mat-icon matSuffix>schedule</mat-icon>
                          </mat-form-field>
                        </div>
                      </div>
                    }

                    <div class="two-column-layout">
                      <div class="column-left">
                        <mat-form-field class="full-width" appearance="outline">
                          <mat-label>Société Intervenant</mat-label>
                          <input matInput formControlName="societeIntervenant">
                        </mat-form-field>
                      </div>

                      <div class="column-right">
                        <mat-form-field class="full-width" appearance="outline">
                          <mat-label>Nombre d'Intervenants</mat-label>
                          <input matInput type="number" formControlName="nombreIntervenant" min="1">
                        </mat-form-field>
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- Section 3: Pertes -->
              <div class="form-section">
                <h3><mat-icon>warning</mat-icon> Pertes</h3>
                
                <div class="toggle-group">
                  <mat-slide-toggle formControlName="hasPerteProduction" color="warn">
                    Perte de Production
                  </mat-slide-toggle>

                  <mat-slide-toggle formControlName="hasPerteCommunication" color="warn">
                    Perte de Communication
                  </mat-slide-toggle>
                </div>

                @if (interventionForm.get('hasPerteProduction')?.value || interventionForm.get('hasPerteCommunication')?.value) {
                  <div class="conditional-section">
                    <div class="two-column-layout">
                      <div class="column-left">
                        <mat-form-field class="full-width" appearance="outline">
                          <mat-label>Date Début Indisponibilité *</mat-label>
                          <input matInput [matDatepicker]="pickerDebutIndispo" formControlName="dateDebutIndisponibilite">
                          <mat-datepicker-toggle matSuffix [for]="pickerDebutIndispo"></mat-datepicker-toggle>
                          <mat-datepicker #pickerDebutIndispo></mat-datepicker>
                        </mat-form-field>
                      </div>

                      <div class="column-right">
                        <mat-form-field class="full-width" appearance="outline">
                          <mat-label>Heure Début *</mat-label>
                          <input matInput type="time" formControlName="heureDebutIndisponibilite">
                          <mat-icon matSuffix>schedule</mat-icon>
                        </mat-form-field>
                      </div>
                    </div>

                    <mat-slide-toggle formControlName="indisponibiliteTerminee" color="primary">
                      Indisponibilité Terminée ?
                    </mat-slide-toggle>

                    @if (interventionForm.get('indisponibiliteTerminee')?.value) {
                      <div class="two-column-layout">
                        <div class="column-left">
                          <mat-form-field class="full-width" appearance="outline">
                            <mat-label>Date Fin Indisponibilité *</mat-label>
                            <input matInput [matDatepicker]="pickerFinIndispo" formControlName="dateFinIndisponibilite">
                            <mat-datepicker-toggle matSuffix [for]="pickerFinIndispo"></mat-datepicker-toggle>
                            <mat-datepicker #pickerFinIndispo></mat-datepicker>
                          </mat-form-field>
                        </div>

                        <div class="column-right">
                          <mat-form-field class="full-width" appearance="outline">
                            <mat-label>Heure Fin *</mat-label>
                            <input matInput type="time" formControlName="heureFinIndisponibilite">
                            <mat-icon matSuffix>schedule</mat-icon>
                          </mat-form-field>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Section 4: Rapport -->
              <div class="form-section">
                <h3><mat-icon>description</mat-icon> Rapport</h3>
                
                <mat-slide-toggle formControlName="rapportAttendu" color="accent">
                  Rapport Attendu ?
                </mat-slide-toggle>

                @if (interventionForm.get('rapportAttendu')?.value) {
                  <div class="conditional-section">
                    <mat-slide-toggle formControlName="rapportRecu" color="primary">
                      Rapport Reçu ?
                    </mat-slide-toggle>
                  </div>
                }
              </div>

              <!-- Section 5: Commentaires -->
              <div class="form-section">
                <h3><mat-icon>comment</mat-icon> Commentaires</h3>
                
                <mat-form-field class="full-width" appearance="outline">
                  <mat-label>Commentaires additionnels</mat-label>
                  <textarea matInput formControlName="commentaires" rows="4" placeholder="Ajoutez des détails supplémentaires..."></textarea>
                </mat-form-field>
              </div>

              <!-- Actions -->
              <div class="form-actions">
                <button mat-button type="button" (click)="goBack()">
                  <mat-icon>close</mat-icon>
                  Annuler
                </button>
                <button mat-raised-button color="primary" type="submit" [disabled]="interventionForm.invalid || loading">
                  <mat-icon>{{ isEditMode ? 'save' : 'add' }}</mat-icon>
                  {{ isEditMode ? 'Enregistrer' : 'Créer' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .form-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .form-content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }

    mat-card {
      max-width: 900px;
      margin: 0 auto;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    form {
      padding: 8px;
    }

    .form-section {
      margin-bottom: 32px;
      padding: 24px;
      background: #f8f9fa;
      border-radius: 12px;
      border-left: 4px solid #667eea;
    }

    .form-section h3 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 20px 0;
      color: #667eea;
      font-size: 20px;
      font-weight: 500;
    }

    .form-section h3 mat-icon {
      color: #667eea;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .date-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .toggle-group {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 20px;
    }

    mat-slide-toggle {
      margin-bottom: 16px;
    }

    .conditional-section {
      margin-top: 20px;
      padding: 20px;
      background: white;
      border-radius: 8px;
      border: 2px dashed #e0e0e0;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 2px solid #e0e0e0;
    }

    .form-actions button {
      min-width: 120px;
    }

    mat-form-field {
      font-size: 14px;
    }

    ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      margin-top: 4px;
    }

    .original-title {
      font-size: 14px;
      font-weight: normal;
      opacity: 0.9;
    }
  `]
})
export class InterventionFormComponent implements OnInit {
  interventionForm: FormGroup;
  isEditMode = false;
  interventionId?: string;
  originalTitle = '';
  predefinedValues: PredefinedValuesMap | null = null;
  filteredEquipements: PredefinedValue[] = [];
  selectedCentraleId: string | null = null;
  predefinedType = PredefinedType;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private interventionService: InterventionService,
    private predefinedService: PredefinedService,
    private snackBar: MatSnackBar
  ) {
    const today = new Date();
    this.interventionForm = this.fb.group({
      titreEvenement: ['', Validators.required],
      dateRef: [today, Validators.required],
      centrale: ['', Validators.required],
      equipement: ['', Validators.required],
      typeEvenement: [[]],  // Array for multiple selection
      typeDysfonctionnement: [[]],  // Array for multiple selection
      
      // Toggle Intervention
      hasIntervention: [false],
      intervenantEnregistre: [''],
      dateDebutIntervention: [''],
      heureDebutIntervention: [''],
      interventionTerminee: [false],
      dateFinIntervention: [''],
      heureFinIntervention: [''],
      societeIntervenant: [''],
      nombreIntervenant: [''],
      
      // Toggle Pertes
      hasPerteProduction: [false],
      hasPerteCommunication: [false],
      dateDebutIndisponibilite: [''],
      heureDebutIndisponibilite: [''],
      indisponibiliteTerminee: [false],
      dateFinIndisponibilite: [''],
      heureFinIndisponibilite: [''],
      
      // Toggle Rapport
      rapportAttendu: [false],
      rapportRecu: [false],
      
      commentaires: [''],
      intervenants: this.fb.array([])
    });
    
    // Set up conditional validators
    this.setupConditionalValidators();
    this.setupCentraleWatcher();
  }

  get intervenants(): FormArray {
    return this.interventionForm.get('intervenants') as FormArray;
  }

  setupCentraleWatcher(): void {
    // Watch centrale selection to filter equipment
    this.interventionForm.get('centrale')?.valueChanges.subscribe(centraleValue => {
      if (centraleValue && this.predefinedValues) {
        // Find the centrale ID
        const centrale = this.predefinedValues[PredefinedType.CENTRALE].find(
          c => c.value === centraleValue
        );
        
        if (centrale) {
          this.selectedCentraleId = centrale.id;
          // Filter equipment by parentId matching centrale ID
          this.filteredEquipements = this.predefinedValues[PredefinedType.EQUIPEMENT].filter(
            eq => eq.parentId === centrale.id
          );
          
          // Reset equipment if current selection is not in filtered list
          const currentEquipement = this.interventionForm.get('equipement')?.value;
          if (currentEquipement && !this.filteredEquipements.find(eq => eq.value === currentEquipement)) {
            this.interventionForm.get('equipement')?.setValue('');
          }
        }
      } else {
        this.filteredEquipements = [];
        this.interventionForm.get('equipement')?.setValue('');
      }
    });
  }

  setupConditionalValidators(): void {
    // Watch hasIntervention toggle
    this.interventionForm.get('hasIntervention')?.valueChanges.subscribe(hasIntervention => {
      const requiredFields = ['intervenantEnregistre', 'dateDebutIntervention', 'heureDebutIntervention'];
      const optionalFields = ['societeIntervenant', 'nombreIntervenant'];
      
      requiredFields.forEach(field => {
        const control = this.interventionForm.get(field);
        if (hasIntervention) {
          control?.setValidators([Validators.required]);
          // Set default dates from dateRef when toggle is activated
          if (field === 'dateDebutIntervention' && !control?.value) {
            control?.setValue(this.interventionForm.get('dateRef')?.value);
          }
          // Set default time to current time
          if (field === 'heureDebutIntervention' && !control?.value) {
            const now = new Date();
            control?.setValue(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
          }
        } else {
          control?.clearValidators();
          control?.setValue('');
        }
        control?.updateValueAndValidity();
      });
      
      // Clear optional fields when intervention is disabled
      if (!hasIntervention) {
        optionalFields.forEach(field => {
          this.interventionForm.get(field)?.setValue('');
        });
        this.interventionForm.get('interventionTerminee')?.setValue(false);
      }
    });
    
    // Watch interventionTerminee toggle
    this.interventionForm.get('interventionTerminee')?.valueChanges.subscribe(terminee => {
      const dateControl = this.interventionForm.get('dateFinIntervention');
      const heureControl = this.interventionForm.get('heureFinIntervention');
      if (terminee) {
        dateControl?.setValidators([Validators.required]);
        heureControl?.setValidators([Validators.required]);
        // Set default date from dateRef
        if (!dateControl?.value) {
          dateControl?.setValue(this.interventionForm.get('dateRef')?.value);
        }
        // Set default time to current time
        if (!heureControl?.value) {
          const now = new Date();
          heureControl?.setValue(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
        }
      } else {
        dateControl?.clearValidators();
        dateControl?.setValue('');
        heureControl?.clearValidators();
        heureControl?.setValue('');
      }
      dateControl?.updateValueAndValidity();
      heureControl?.updateValueAndValidity();
    });

    // Watch perte toggles
    this.interventionForm.get('hasPerteProduction')?.valueChanges.subscribe(() => this.updatePerteValidators());
    this.interventionForm.get('hasPerteCommunication')?.valueChanges.subscribe(() => this.updatePerteValidators());
    
    // Watch indisponibiliteTerminee toggle
    this.interventionForm.get('indisponibiliteTerminee')?.valueChanges.subscribe(terminee => {
      const dateControl = this.interventionForm.get('dateFinIndisponibilite');
      const heureControl = this.interventionForm.get('heureFinIndisponibilite');
      if (terminee) {
        dateControl?.setValidators([Validators.required]);
        heureControl?.setValidators([Validators.required]);
        // Set default date from dateRef
        if (!dateControl?.value) {
          dateControl?.setValue(this.interventionForm.get('dateRef')?.value);
        }
        // Set default time to current time
        if (!heureControl?.value) {
          const now = new Date();
          heureControl?.setValue(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
        }
      } else {
        dateControl?.clearValidators();
        dateControl?.setValue('');
        heureControl?.clearValidators();
        heureControl?.setValue('');
      }
      dateControl?.updateValueAndValidity();
      heureControl?.updateValueAndValidity();
    });
    
    // Watch rapportAttendu toggle
    this.interventionForm.get('rapportAttendu')?.valueChanges.subscribe(attendu => {
      const control = this.interventionForm.get('rapportRecu');
      if (!attendu) {
        control?.setValue(false);
      }
    });
  }

  updatePerteValidators(): void {
    const hasPerteProduction = this.interventionForm.get('hasPerteProduction')?.value;
    const hasPerteCommunication = this.interventionForm.get('hasPerteCommunication')?.value;
    const hasAnyPerte = hasPerteProduction || hasPerteCommunication;
    
    const dateDebutControl = this.interventionForm.get('dateDebutIndisponibilite');
    const heureDebutControl = this.interventionForm.get('heureDebutIndisponibilite');
    if (hasAnyPerte) {
      dateDebutControl?.setValidators([Validators.required]);
      heureDebutControl?.setValidators([Validators.required]);
      // Set default date from dateRef when perte toggle is activated
      if (!dateDebutControl?.value) {
        dateDebutControl?.setValue(this.interventionForm.get('dateRef')?.value);
      }
      // Set default time to current time
      if (!heureDebutControl?.value) {
        const now = new Date();
        heureDebutControl?.setValue(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      }
    } else {
      dateDebutControl?.clearValidators();
      dateDebutControl?.setValue('');
      heureDebutControl?.clearValidators();
      heureDebutControl?.setValue('');
      this.interventionForm.get('indisponibiliteTerminee')?.setValue(false);
      this.interventionForm.get('dateFinIndisponibilite')?.setValue('');
      this.interventionForm.get('heureFinIndisponibilite')?.setValue('');
    }
    dateDebutControl?.updateValueAndValidity();
    heureDebutControl?.updateValueAndValidity();
  }

  ngOnInit(): void {
    this.loadPredefinedValues();
    this.interventionId = this.route.snapshot.paramMap.get('id') || undefined;
    this.isEditMode = !!this.interventionId;

    if (this.isEditMode && this.interventionId) {
      this.loadIntervention(this.interventionId);
    }
  }

  loadPredefinedValues(): void {
    this.predefinedService.getAllValues().subscribe({
      next: (response) => {
        if (response.success) {
          this.predefinedValues = response.data.values;
          
          // If editing and centrale is already set, filter equipment
          const centraleValue = this.interventionForm.get('centrale')?.value;
          if (centraleValue) {
            const centrale = this.predefinedValues[PredefinedType.CENTRALE].find(
              c => c.value === centraleValue
            );
            if (centrale) {
              this.filteredEquipements = this.predefinedValues[PredefinedType.EQUIPEMENT].filter(
                eq => eq.parentId === centrale.id
              );
            }
          }
        }
      }
    });
  }

  loadIntervention(id: string): void {
    this.interventionService.getInterventionById(id).subscribe({
      next: (response) => {
        if (response.success) {
          const intervention = response.data.intervention;
          
          // Store original title for display
          this.originalTitle = intervention.titre;
          
          // DEBUG: Log raw data
          console.log('🔍 [FORM] Raw intervention data:', intervention);
          console.log('🔍 [FORM] typeEvenement:', intervention.typeEvenement, typeof intervention.typeEvenement);
          console.log('🔍 [FORM] typeDysfonctionnement:', intervention.typeDysfonctionnement, typeof intervention.typeDysfonctionnement);
          
          // Parse JSON strings for type fields
          const formData: any = { ...intervention };
          
          if (typeof intervention.typeEvenement === 'string') {
            try {
              formData.typeEvenement = JSON.parse(intervention.typeEvenement);
              console.log('✅ [FORM] Parsed typeEvenement:', formData.typeEvenement);
            } catch (e) {
              console.log('⚠️ [FORM] Failed to parse typeEvenement, using as array:', e);
              formData.typeEvenement = intervention.typeEvenement ? [intervention.typeEvenement] : [];
            }
          }
          
          if (typeof intervention.typeDysfonctionnement === 'string') {
            try {
              formData.typeDysfonctionnement = JSON.parse(intervention.typeDysfonctionnement);
              console.log('✅ [FORM] Parsed typeDysfonctionnement:', formData.typeDysfonctionnement);
            } catch (e) {
              console.log('⚠️ [FORM] Failed to parse typeDysfonctionnement, using as array:', e);
              formData.typeDysfonctionnement = intervention.typeDysfonctionnement ? [intervention.typeDysfonctionnement] : [];
            }
          }
          
          console.log('🔍 [FORM] Final formData:', formData);
          this.interventionForm.patchValue(formData);
          
          // Load intervenants
          if (intervention.intervenants) {
            intervention.intervenants.forEach(intervenant => {
              this.intervenants.push(this.fb.group(intervenant));
            });
          }
        }
      }
    });
  }

  addIntervenant(): void {
    this.intervenants.push(this.fb.group({
      nom: [''],
      prenom: [''],
      type: [''],
      entreprise: ['']
    }));
  }

  removeIntervenant(index: number): void {
    this.intervenants.removeAt(index);
  }

  onSubmit(): void {
    if (this.interventionForm.valid) {
      this.loading = true;
      const formData = this.interventionForm.value;
      
      // Combine date and time fields for intervention
      const data = { ...formData };
      if (formData.dateDebutIntervention && formData.heureDebutIntervention) {
        const dateDebut = new Date(formData.dateDebutIntervention);
        const [hours, minutes] = formData.heureDebutIntervention.split(':');
        dateDebut.setHours(parseInt(hours), parseInt(minutes));
        data.dateDebutIntervention = dateDebut.toISOString();
      }
      if (formData.dateFinIntervention && formData.heureFinIntervention) {
        const dateFin = new Date(formData.dateFinIntervention);
        const [hours, minutes] = formData.heureFinIntervention.split(':');
        dateFin.setHours(parseInt(hours), parseInt(minutes));
        data.dateFinIntervention = dateFin.toISOString();
      }
      
      // Combine date and time fields for indisponibilite
      if (formData.dateDebutIndisponibilite && formData.heureDebutIndisponibilite) {
        const dateDebut = new Date(formData.dateDebutIndisponibilite);
        const [hours, minutes] = formData.heureDebutIndisponibilite.split(':');
        dateDebut.setHours(parseInt(hours), parseInt(minutes));
        data.dateDebutIndisponibilite = dateDebut.toISOString();
      }
      if (formData.dateFinIndisponibilite && formData.heureFinIndisponibilite) {
        const dateFin = new Date(formData.dateFinIndisponibilite);
        const [hours, minutes] = formData.heureFinIndisponibilite.split(':');
        dateFin.setHours(parseInt(hours), parseInt(minutes));
        data.dateFinIndisponibilite = dateFin.toISOString();
      }
      
      // Remove time fields from data as they're now combined
      delete data.heureDebutIntervention;
      delete data.heureFinIntervention;
      delete data.heureDebutIndisponibilite;
      delete data.heureFinIndisponibilite;

      const operation = this.isEditMode && this.interventionId
        ? this.interventionService.updateIntervention(this.interventionId, data)
        : this.interventionService.createIntervention(data);

      operation.subscribe({
        next: () => {
          this.snackBar.open(
            this.isEditMode ? 'Intervention modifiée' : 'Intervention créée',
            'Fermer',
            { duration: 3000 }
          );
          this.goBack();
        },
        error: (error) => {
          this.loading = false;
          this.snackBar.open('Erreur: ' + (error.error?.message || 'Erreur inconnue'), 'Fermer', {
            duration: 5000
          });
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/interventions']);
  }
}
