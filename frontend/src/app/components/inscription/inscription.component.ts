import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Candidature } from '../../models/models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inscription',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container fade-in">
      <div class="glass-card form-container">
        <h2 class="font-outfit text-center">Déposer votre candidature</h2>
        
        <form [formGroup]="form" (ngSubmit)="submit()">
          <!-- Step 1: Informations Personnelles -->
          <div *ngIf="step === 1">
            <h3 class="step-title">1. Informations Personnelles</h3>
            <div class="grid-2">
              <div class="input-group">
                <label>Nom</label>
                <input type="text" formControlName="nom">
              </div>
              <div class="input-group">
                <label>Prénom</label>
                <input type="text" formControlName="prenom">
              </div>
            </div>
            <div class="grid-2">
              <div class="input-group">
                <label>CIN</label>
                <input type="text" formControlName="cin">
              </div>
              <div class="input-group">
                <label>Date de Naissance</label>
                <input type="date" formControlName="dateNaissance">
              </div>
            </div>
            <div class="grid-2">
              <div class="input-group">
                <label>Email</label>
                <input type="email" formControlName="email">
              </div>
              <div class="input-group">
                <label>Téléphone</label>
                <input type="tel" formControlName="telephone">
              </div>
            </div>
            <div class="input-group">
              <label>Adresse</label>
              <textarea formControlName="adresse"></textarea>
            </div>
          </div>

          <!-- Step 2: Diplômes -->
          <div *ngIf="step === 2">
            <h3 class="step-title">2. Diplôme Principal</h3>
            <div class="input-group">
              <label>Intitulé du Diplôme</label>
              <input type="text" formControlName="nomDiplome">
            </div>
            <div class="grid-2">
              <div class="input-group">
                <label>Niveau</label>
                <select formControlName="niveau">
                  <option value="Bac">Bac</option>
                  <option value="Bac+2">Bac+2</option>
                  <option value="Licence">Licence</option>
                  <option value="Master">Master</option>
                </select>
              </div>
              <div class="input-group">
                <label>Année d'obtention</label>
                <input type="number" formControlName="anneeObtention">
              </div>
            </div>
          </div>

          <!-- Step 3: Choix du Concours -->
          <div *ngIf="step === 3">
            <h3 class="step-title">3. Choix du Concours & Centre</h3>
            <div class="input-group">
              <label>Concours</label>
              <select formControlName="concoursId">
                <option value="1">Concours d'entrée 2026</option>
              </select>
            </div>
            <div class="grid-2">
              <div class="input-group">
                <label>Spécialité</label>
                <select formControlName="specialiteId">
                  <option value="1">Informatique</option>
                  <option value="2">Gestion</option>
                </select>
              </div>
              <div class="input-group">
                <label>Centre d'examen</label>
                <select formControlName="centreId">
                  <option value="1">Centre Casablanca</option>
                  <option value="2">Centre Rabat</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <div class="form-nav">
            <button type="button" class="btn btn-secondary" *ngIf="step > 1" (click)="prev()">Précédent</button>
            <button type="button" class="btn btn-primary" *ngIf="step < 3" (click)="next()">Suivant</button>
            <button type="submit" class="btn btn-primary" *ngIf="step === 3" [disabled]="loading">
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
      max-width: 800px;
      margin: 2rem auto;
      padding: 3rem;
    }
    .step-title {
      margin-bottom: 2rem;
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
      margin-top: 3rem;
      gap: 1rem;
    }
    .text-center { text-align: center; }
    .alert {
      margin-top: 2rem;
      padding: 1rem;
      border-radius: var(--radius);
      font-weight: 500;
    }
    .alert-error {
      background: #fef2f2;
      color: var(--error);
      border: 1px solid #fee2e2;
    }
  `]
})
export class InscriptionComponent implements OnInit {
  step = 1;
  form!: FormGroup;
  loading = false;
  errorMessage = '';

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
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required],
      adresse: [''],
      nomDiplome: ['', Validators.required],
      niveau: ['Licence', Validators.required],
      anneeObtention: [2024, Validators.required],
      concoursId: [1, Validators.required],
      specialiteId: [1, Validators.required],
      centreId: [1, Validators.required]
    });
  }

  next() { this.step++; }
  prev() { this.step--; }

  submit() {
    if (this.form.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires correctement.';
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
        email: val.email,
        telephone: val.telephone,
        adresse: val.adresse
      },
      concours: { id: +val.concoursId },
      specialite: { id: +val.specialiteId },
      centre: { id: +val.centreId }
    };

    this.api.postuler(candidature).subscribe({
      next: (res) => {
        alert(res.message);
        this.router.navigate(['/suivi', res.data.numeroCandidature]);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Une erreur est survenue lors de la soumission.';
      }
    });
  }
}
