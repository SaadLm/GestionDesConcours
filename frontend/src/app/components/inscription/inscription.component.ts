import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Candidature, Centre, ConcoursOption, Specialite } from '../../models/models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inscription',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container fade-in">
      <div class="glass-card form-container">
        <h2 class="font-outfit text-center">Plateforme de candidature aux concours</h2>
        <p class="section-subtitle">Inscrivez-vous en ligne sans création de compte et suivez l'état de votre dossier avec un numéro unique.</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="step-indicator">Étape {{ step }} sur 5</div>

          <!-- Step 1: Choix du concours -->
          <div *ngIf="step === 1">
            <h3 class="step-title">1. Choisissez votre concours ouvert</h3>
            <p class="help-text">Ces champs servent uniquement à filtrer les concours ouverts. Sélectionnez un concours dans la liste pour avancer.</p>
            <div class="grid-2">
              <div class="input-group">
                <label>Filtrer par centre</label>
                <input type="text" [value]="centreFilter" (input)="centreFilter = $any($event.target).value" placeholder="Nom du centre">
              </div>
              <div class="input-group">
                <label>Filtrer par spécialité</label>
                <input type="text" [value]="specialiteFilter" (input)="specialiteFilter = $any($event.target).value" placeholder="Nom de la spécialité">
              </div>
            </div>

            <div class="input-group">
              <label>Filtrer par ville</label>
              <select [value]="cityFilter" (change)="onCityFilterChange($event)">
                <option value="">Toutes les villes</option>
                <option *ngFor="let ville of centreCities" [value]="ville">{{ ville }}</option>
              </select>
            </div>
            
            <div class="select-list">
              <div class="info-block" *ngIf="selectedOption">
                <p><strong>Option sélectionnée :</strong> {{ selectedOptionInfo }}</p>
              </div>
              <div *ngIf="loadingData" class="loading-state">Chargement des concours ouverts...</div>
              <div *ngIf="!loadingData && filteredOptions.length === 0" class="empty-state">
                <p>Aucune option de concours disponible. Vérifiez vos filtres ou revenez plus tard.</p>
              </div>
              <div *ngIf="!loadingData && filteredOptions.length > 0" class="options-grid">
                <article class="option-card" *ngFor="let option of filteredOptions" (click)="selectOption(option)" [class.selected]="selectedOption?.optionId === option.optionId">
                  <div class="option-header">
                    <div>
                      <h4>{{ option.concoursTitre }}</h4>
                    </div>
                    <span class="status-badge">{{ option.statut }}</span>
                    <span class="status-badge">{{ option.centreVille }}</span>
                  </div>
                  <p class="meta"> spécialité : {{ option.specialiteNom }} · <br>centre : {{ option.centreNom }} · 
                  <!-- <br>ville : {{ option.centreVille }} -->
                </p>
                  <p class="description">{{ option.concoursDescription || 'Description du concours non fournie.' }}</p>
                  <div class="option-footer">
                    <span>Inscriptions : {{ option.dateDebutInscription || 'N/A' }} → {{ option.dateFinInscription || 'N/A' }}</span>
                    <span>Places : {{ option.nombrePlaces ?? 'N/A' }}</span>
                  </div>
                  <!-- <button type="button" class="btn btn-outline">Sélectionner</button> -->
                </article>
              </div>
            </div>

          </div>

          <!-- Step 2: Informations personnelles -->
          <div *ngIf="step === 2">
            <h3 class="step-title">2. Informations personnelles</h3>
            <div class="grid-2">
              <div class="input-group">
                <label>Nom *</label>
                <input type="text" formControlName="nom">
              </div>
              <div class="input-group">
                <label>Prénom *</label>
                <input type="text" formControlName="prenom">
              </div>
            </div>
            <div class="grid-2">
              <div class="input-group">
                <label>CIN *</label>
                <input type="text" formControlName="cin">
              </div>
              <div class="input-group">
                <label>Date de naissance *</label>
                <input type="date" formControlName="dateNaissance">
              </div>
            </div>
            <div class="input-group">
              <label>Lieu de naissance *</label>
              <input type="text" formControlName="lieuNaissance">
            </div>
            <div class="input-group">
              <label>Adresse complète *</label>
              <textarea formControlName="adresse" rows="3"></textarea>
            </div>
          </div>

          <!-- Step 3: Coordonnées -->
          <div *ngIf="step === 3">
            <h3 class="step-title">3. Coordonnées</h3>
            <div class="grid-2">
              <div class="input-group">
                <label>Email *</label>
                <input type="email" formControlName="email">
              </div>
              <div class="input-group">
                <label>Numéro de téléphone </label>
                <input type="tel" formControlName="telephone">
              </div>
            </div>

            <div class="input-group" *ngIf="selectedOption">
              <label>Concours choisi</label>
              <input type="text" [value]="selectedOption.concoursTitre" disabled>
            </div>
            <div class="grid-2" *ngIf="selectedOption">
              <div class="input-group">
                <label>Spécialité choisie</label>
                <input type="text" [value]="selectedOption.specialiteNom" disabled>
              </div>
              <div class="input-group">
                <label>Centre choisi</label>
                <input type="text" [value]="selectedOption.centreNom + ' - ' + selectedOption.centreVille" disabled>
              </div>
            </div>
          </div>

          <!-- Step 4: Informations académiques et professionnelles -->
          <div *ngIf="step === 4">
            <h3 class="step-title">4. Parcours académique et expérience</h3>
            <div class="input-group">
              <label>Diplôme obtenu *</label>
              <input type="text" formControlName="intituleDiplome">
            </div>
            <div class="grid-2">
              <div class="input-group">
                <label>Niveau d'études *</label>
                <select formControlName="niveau">
                  <option value="Bac">Bac</option>
                  <option value="Bac+2">Bac+2</option>
                  <option value="Licence">Licence</option>
                  <option value="Master">Master</option>
                  <option value="Doctorat">Doctorat</option>
                </select>
              </div>
              <div class="input-group">
                <label>Année d'obtention *</label>
                <input type="number" formControlName="anneeObtention" min="1900" max="2100">
              </div>
            </div>
            <div class="input-group">
              <label>Établissement *</label>
              <input type="text" formControlName="etablissement">
            </div>
            <div class="input-group">
              <label>Spécialité du diplôme *</label>
              <input type="text" formControlName="specialiteDiplome">
            </div>
            <div class="input-group">
              <label>Expérience professionnelle </label>
              <textarea formControlName="experienceProfessionnelle" rows="4"></textarea>
            </div>
          </div>

          <!-- Step 5: Documents et confirmation -->
          <div *ngIf="step === 5">
            <h3 class="step-title">5. Documents et validation</h3>
            <div class="input-group">
              <label>Copie de la CIN *</label>
              <input type="text" formControlName="documentCin" placeholder="Nom de fichier ou description du document">
            </div>
            <div class="input-group">
              <label>Curriculum Vitae (CV) *</label>
              <input type="text" formControlName="documentCv" placeholder="Nom de fichier ou description du document">
            </div>
            <div class="input-group">
              <label>Diplômes et attestations *</label>
              <input type="text" formControlName="documentDiplome" placeholder="Nom de fichier ou description du document">
            </div>
            <div class="grid-2">
              <div class="input-group checkbox-group">
                <label>
                  <input type="checkbox" formControlName="notificationEmail"> Notifications par email
                </label>
              </div>
            </div>
            <div class="input-group checkbox-group">
              <label>
                <input type="checkbox" formControlName="acceptTerms"> J'accepte les conditions d'utilisation et la politique de confidentialité
              </label>
            </div>
          </div>

          <div class="form-nav">
            <button type="button" class="btn btn-secondary" *ngIf="step > 1" (click)="prev()">Précédent</button>
            <button type="button" class="btn btn-primary" *ngIf="step < 5" (click)="nextStep()" [disabled]="step === 1 && !selectedOption">Suivant</button>
            <button type="submit" class="btn btn-primary" *ngIf="step === 5" [disabled]="loading">
              {{ loading ? 'Envoi en cours...' : 'Soumettre ma candidature' }}
            </button>
          </div>
        </form>

        <div *ngIf="errorMessage" class="alert alert-error fade-in">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 880px;
      margin: 2rem auto;
      padding: 2.5rem;
    }
    .section-subtitle {
      margin: 0.5rem 0 2rem;
      color: var(--text-muted);
      text-align: center;
    }
    .step-indicator {
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
      color: var(--secondary);
      text-align: right;
    }
    .step-title {
      margin-bottom: 1.5rem;
      color: var(--primary);
      border-bottom: 2px solid var(--border);
      padding-bottom: 0.5rem;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    .form-nav {
      display: flex;
      justify-content: space-between;
      margin-top: 2.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .help-text {
      margin: 1rem 0 1.5rem;
      color: var(--text-muted);
      font-size: 0.95rem;
    }
    .select-list {
      margin-top: 1rem;
    }
    .options-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
    }
    .option-card {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1rem;
      background: rgba(255,255,255,0.95);
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
    }
    .option-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.08);
      border-color: var(--primary);
    }
    .option-card.selected {
      border-color: var(--primary);
      background: rgba(234, 245, 255, 0.95);
    }
    .option-header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }
    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.8rem;
      text-transform: uppercase;
      color: var(--primary);
      border: 1px solid var(--primary);
      background: rgba(255,255,255,0.9);
    }
    .meta {
      margin: 0.35rem 0 0.75rem;
      font-size: 0.95rem;
      color: var(--text-muted);
    }
    .description {
      margin-bottom: 1rem;
      color: var(--text-muted);
      min-height: 3em;
    }
    .option-footer {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      font-size: 0.9rem;
      color: var(--text-muted);
      flex-wrap: wrap;
    }
    .text-center { text-align: center; }
    .alert {
      margin-top: 1.5rem;
      padding: 1rem;
      border-radius: var(--radius);
      font-weight: 500;
    }
    .alert-error {
      background: #fef2f2;
      color: var(--error);
      border: 1px solid #fee2e2;
    }
    .checkbox-group label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 500;
    }
    @media (max-width: 720px) {
      .grid-2 {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class InscriptionComponent implements OnInit {
  step = 1;
  form!: FormGroup;
  loading = false;
  loadingData = true;
  errorMessage = '';
  concoursOptions: ConcoursOption[] = [];
  specialiteList: Specialite[] = [];
  centreList: Centre[] = [];
  filteredCentreChoices: Centre[] = [];
  selectedOption?: ConcoursOption;
  optionFilter = '';
  cityFilter = '';
  centreFilter = '';
  specialiteFilter = '';

  get filteredCentres(): Centre[] {
    let centres = this.centreList;
    if (this.cityFilter) {
      centres = centres.filter(c => c.ville?.toLowerCase().includes(this.cityFilter.toLowerCase()));
    }
    if (this.centreFilter) {
      centres = centres.filter(c => c.nom?.toLowerCase().includes(this.centreFilter.toLowerCase()));
    }
    return centres;
  }

  get centreCities(): string[] {
    return Array.from(new Set(this.centreList.map(c => c.ville).filter(Boolean))).sort();
  }

  get filteredOptions(): ConcoursOption[] {
    return this.concoursOptions.filter(option => {
      const matchesCentre = this.centreFilter
        ? option.centreNom.toLowerCase().includes(this.centreFilter.toLowerCase())
        : true;
      const matchesSpecialite = this.specialiteFilter
        ? option.specialiteNom.toLowerCase().includes(this.specialiteFilter.toLowerCase())
        : true;
      const matchesCity = this.cityFilter
        ? option.centreVille.toLowerCase().includes(this.cityFilter.toLowerCase())
        : true;
      return matchesCentre && matchesSpecialite && matchesCity;
    });
  }

  get selectedOptionInfo(): string {
    if (!this.selectedOption) {
      return 'Aucune option sélectionnée';
    }
    return `${this.selectedOption.concoursTitre} — ${this.selectedOption.specialiteNom} @ ${this.selectedOption.centreNom}, ${this.selectedOption.centreVille}`;
  }

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      cin: ['', Validators.required],
      dateNaissance: ['', Validators.required],
      lieuNaissance: ['', Validators.required],
      adresse: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: [''],
      concoursId: [null, Validators.required],
      specialiteId: [null, Validators.required],
      centreId: [null, Validators.required],
      intituleDiplome: ['', Validators.required],
      niveau: ['Licence', Validators.required],
      anneeObtention: [2024, [Validators.required, Validators.min(1900), Validators.max(2100)]],
      etablissement: ['', Validators.required],
      specialiteDiplome: ['', Validators.required],
      experienceProfessionnelle: [''],
      documentCin: ['', Validators.required],
      documentCv: ['', Validators.required],
      documentDiplome: ['', Validators.required],
      notificationEmail: [true],
      notificationSms: [false],
      acceptTerms: [false, Validators.requiredTrue]
    });

    this.loadPublicOptions();
  }

  nextStep() {
    if (this.step === 1 && !this.selectedOption) {
      this.errorMessage = 'Veuillez sélectionner un concours avant de continuer.';
      return;
    }

    if (this.step === 2 && this.isStepInvalid(['nom', 'prenom', 'cin', 'dateNaissance', 'lieuNaissance', 'adresse'])) {
      this.errorMessage = 'Veuillez compléter les informations personnelles avant de continuer.';
      return;
    }

    if (this.step === 3 && this.isStepInvalid(['email', 'telephone'])) {
      this.errorMessage = 'Veuillez compléter les coordonnées avant de continuer.';
      return;
    }

    if (this.step === 4 && this.isStepInvalid(['intituleDiplome', 'niveau', 'anneeObtention', 'etablissement', 'specialiteDiplome', 'experienceProfessionnelle'])) {
      this.errorMessage = 'Veuillez compléter le parcours académique et l’expérience professionnelle.';
      return;
    }

    this.errorMessage = '';
    this.step++;
  }

  prev() {
    this.errorMessage = '';
    if (this.step > 1) {
      this.step--;
    }
  }

  submit() {
    if (this.form.invalid) {
      this.errorMessage = 'Veuillez vérifier tous les champs et accepter les conditions d’utilisation.';
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const val = this.form.value;
    const candidature: Candidature = {
      candidat: {
        nom: val.nom,
        prenom: val.prenom,
        cin: val.cin,
        dateNaissance: val.dateNaissance,
        lieuNaissance: val.lieuNaissance,
        adresse: val.adresse,
        email: val.email,
        telephone: val.telephone,
        diplomes: [
          {
            nomDiplome: val.intituleDiplome,
            niveau: val.niveau,
            specialite: val.specialiteDiplome,
            anneeObtention: +val.anneeObtention
          }
        ]
      },
      concours: { id: +val.concoursId },
      specialite: { id: +val.specialiteId },
      centre: { id: +val.centreId },
      diplome: {
        nomDiplome: val.intituleDiplome,
        niveau: val.niveau,
        specialite: val.specialiteDiplome,
        anneeObtention: +val.anneeObtention
      },
      experienceProfessionnelle: val.experienceProfessionnelle,
      documents: {
        cin: val.documentCin,
        cv: val.documentCv,
        diplome: val.documentDiplome
      },
      notifications: {
        email: val.notificationEmail,
        sms: val.notificationSms
      }
    };

    this.api.postuler(candidature).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.router.navigate(['/suivi', res.data.numeroCandidature]);
        } else {
          this.errorMessage = res.message || 'La soumission a échoué.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Une erreur est survenue lors de la soumission.';
      }
    });
  }

  private loadPublicOptions() {
    forkJoin({
      options: this.api.getConcoursOptions(),
      specialites: this.api.getSpecialites(),
      centres: this.api.getCentres()
    }).subscribe({
      next: ({ options, specialites, centres }) => {
        this.concoursOptions = options.data || [];
        this.specialiteList = specialites.data || [];
        this.centreList = centres.data || [];

        this.loadingData = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les options de concours. Veuillez réessayer ultérieurement.';
        this.loadingData = false;
      }
    });
  }

  selectOption(option: ConcoursOption) {
    this.selectedOption = option;
    this.form.get('concoursId')?.setValue(option.concoursId);
    this.form.get('specialiteId')?.setValue(option.specialiteId);
    this.form.get('centreId')?.setValue(option.centreId);
    this.errorMessage = '';
  }

  onCityFilterChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.cityFilter = select.value;
  }

  private isStepInvalid(controls: string[]) {
    for (const control of controls) {
      if (this.form.get(control)?.invalid) {
        this.form.get(control)?.markAsTouched();
        return true;
      }
    }
    return false;
  }
}
