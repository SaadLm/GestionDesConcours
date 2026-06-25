import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Candidature, Centre, Concours, Specialite } from '../../models/models';
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
          <div class="step-indicator">Étape {{ step }} sur 4</div>

          <!-- Step 1: Informations Personnelles -->
          <div *ngIf="step === 1">
            <h3 class="step-title">1. Informations personnelles</h3>
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

          <!-- Step 2: Coordonnées et choix de concours -->
          <div *ngIf="step === 2">
            <h3 class="step-title">2. Coordonnées et choix de concours</h3>
            <div class="grid-2">
              <div class="input-group">
                <label>Email *</label>
                <input type="email" formControlName="email">
              </div>
              <div class="input-group">
                <label>Numéro de téléphone *</label>
                <input type="tel" formControlName="telephone">
              </div>
            </div>

            <div class="input-group">
              <label>Concours *</label>
              <select formControlName="concoursId">
                <option *ngFor="let concours of concoursList" [value]="concours.id">{{ concours.nom }}</option>
              </select>
            </div>

            <div class="grid-2">
              <div class="input-group">
                <label>Spécialité souhaitée *</label>
                <select formControlName="specialiteId">
                  <option *ngFor="let specialite of specialiteList" [value]="specialite.id">{{ specialite.nom }}</option>
                </select>
              </div>
              <div class="input-group">
                <label>Centre d'examen *</label>
                <select formControlName="centreId">
                  <option *ngFor="let centre of centreList" [value]="centre.id">{{ centre.nom }} - {{ centre.ville }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Step 3: Informations académiques et professionnelles -->
          <div *ngIf="step === 3">
            <h3 class="step-title">3. Parcours académique et expérience</h3>
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
              <label>Expérience professionnelle *</label>
              <textarea formControlName="experienceProfessionnelle" rows="4"></textarea>
            </div>
          </div>

          <!-- Step 4: Documents et confirmation -->
          <div *ngIf="step === 4">
            <h3 class="step-title">4. Documents et validation</h3>
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
              <div class="input-group checkbox-group">
                <label>
                  <input type="checkbox" formControlName="notificationSms"> Notifications par SMS
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
            <button type="button" class="btn btn-primary" *ngIf="step < 4" (click)="nextStep()">Suivant</button>
            <button type="submit" class="btn btn-primary" *ngIf="step === 4" [disabled]="loading">
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
  errorMessage = '';
  concoursList: Concours[] = [
    { id: 1, nom: 'Concours d’entrée 2026', description: 'Concours national', dateConcours: '2026-09-25', dateDebutInscription: '2026-05-01', dateFinInscription: '2026-09-10', statut: 'Ouvert' }
  ];
  specialiteList: Specialite[] = [
    { id: 1, nom: 'Informatique' },
    { id: 2, nom: 'Gestion' },
    { id: 3, nom: 'Marketing' }
  ];
  centreList: Centre[] = [
    { id: 1, nom: 'Centre Casablanca', ville: 'Casablanca', adresse: 'Rue A', telephone: '+212 5 22 00 00 01' },
    { id: 2, nom: 'Centre Rabat', ville: 'Rabat', adresse: 'Rue B', telephone: '+212 5 22 00 00 02' }
  ];

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
      telephone: ['', Validators.required],
      concoursId: [1, Validators.required],
      specialiteId: [1, Validators.required],
      centreId: [1, Validators.required],
      intituleDiplome: ['', Validators.required],
      niveau: ['Licence', Validators.required],
      anneeObtention: [2024, [Validators.required, Validators.min(1900), Validators.max(2100)]],
      etablissement: ['', Validators.required],
      specialiteDiplome: ['', Validators.required],
      experienceProfessionnelle: ['', Validators.required],
      documentCin: ['', Validators.required],
      documentCv: ['', Validators.required],
      documentDiplome: ['', Validators.required],
      notificationEmail: [true],
      notificationSms: [false],
      acceptTerms: [false, Validators.requiredTrue]
    });
  }

  nextStep() {
    if (this.step === 1 && this.isStepInvalid(['nom', 'prenom', 'cin', 'dateNaissance', 'lieuNaissance', 'adresse'])) {
      this.errorMessage = 'Veuillez compléter les informations personnelles avant de continuer.';
      return;
    }

    if (this.step === 2 && this.isStepInvalid(['email', 'telephone', 'concoursId', 'specialiteId', 'centreId'])) {
      this.errorMessage = 'Veuillez compléter les coordonnées et le choix du concours.';
      return;
    }

    if (this.step === 3 && this.isStepInvalid(['intituleDiplome', 'niveau', 'anneeObtention', 'etablissement', 'specialiteDiplome', 'experienceProfessionnelle'])) {
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
        telephone: val.telephone
      },
      concours: { id: +val.concoursId },
      specialite: { id: +val.specialiteId },
      centre: { id: +val.centreId },
      diplome: {
        intitule: val.intituleDiplome,
        niveau: val.niveau,
        etablissement: val.etablissement,
        anneeObtention: val.anneeObtention,
        specialite: val.specialiteDiplome
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
