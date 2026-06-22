import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Candidature } from '../../models/models';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container fade-in">
      <div class="glass-card tracking-container">
        <h2 class="font-outfit text-center">Suivi de candidature</h2>

        <p class="section-subtitle">Saisissez le code reçu par email pour consulter l’état de votre dossier et suivre chaque étape.</p>

        <div class="search-box">
          <input type="text" [(ngModel)]="numero" placeholder="Ex: CAND-2026-XXXXXX" (keyup.enter)="rechercher()">
          <button class="btn btn-primary" (click)="rechercher()" [disabled]="loading">Chercher</button>
        </div>

        <div *ngIf="candidature" class="result fade-in">
          <div class="status-header" [ngClass]="getStatusClass(candidature.statut)">
            <div class="badge">{{ candidature.statut || 'EN COURS' }}</div>
            <p><strong>Numéro de candidature :</strong> {{ candidature.numeroCandidature }}</p>
          </div>

          <div class="progress-steps">
            <div class="step" [class.active]="currentStep >= 1">
              <span>1</span>
              <p>Soumission</p>
            </div>
            <div class="step" [class.active]="currentStep >= 2">
              <span>2</span>
              <p>Examen</p>
            </div>
            <div class="step" [class.active]="currentStep >= 3">
              <span>3</span>
              <p>Décision</p>
            </div>
          </div>

          <div class="details-grid">
            <div class="details-card">
              <h3>Détails du candidat</h3>
              <p><strong>Nom :</strong> {{ candidature.candidat.nom }} {{ candidature.candidat.prenom }}</p>
              <p><strong>CIN :</strong> {{ candidature.candidat.cin }}</p>
              <p><strong>Email :</strong> {{ candidature.candidat.email }}</p>
            </div>
            <div class="details-card">
              <h3>Concours</h3>
              <p><strong>Concours :</strong> {{ candidature.concours.titre }}</p>
              <p><strong>Spécialité :</strong> {{ candidature.specialite.nom }}</p>
              <p><strong>Centre :</strong> {{ candidature.centre.nom }} - {{ candidature.centre.ville }}</p>
            </div>
          </div>

          <div *ngIf="candidature.commentaire" class="comment">
            <strong>Commentaire du gestionnaire :</strong>
            <p>{{ candidature.commentaire }}</p>
          </div>
        </div>

        <div *ngIf="error" class="alert alert-error">
          {{ error }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tracking-container {
      max-width: 700px;
      margin: 2rem auto;
      padding: 2.5rem;
    }
    .search-box {
      margin-top: 1.5rem;
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .search-box input {
      flex: 1;
      min-width: 220px;
    }
    .section-subtitle {
      margin-top: 0.5rem;
      color: var(--text-muted);
      text-align: center;
    }
    .result {
      margin-top: 2.5rem;
      border-top: 2px solid var(--border);
      padding-top: 2rem;
    }
    .status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.75rem;
      padding: 1rem;
      border-radius: var(--radius);
    }
    .badge {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 700;
      font-size: 0.875rem;
      text-transform: uppercase;
    }
    .status-header.EN_COURS { background: #eff6ff; border: 1px solid #bfdbfe; }
    .status-header.EN_COURS .badge { background: #3b82f6; color: white; }
    .status-header.VALIDEE { background: #ecfdf5; border: 1px solid #a7f3d0; }
    .status-header.VALIDEE .badge { background: #10b981; color: #064e3b; }
    .status-header.REJETEE { background: #fef2f2; border: 1px solid #fee2e2; }
    .status-header.REJETEE .badge { background: #ef4444; color: #7f1d1d; }

    .progress-steps {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .step {
      padding: 1rem;
      border-radius: var(--radius);
      background: #f8fafc;
      text-align: center;
      border: 1px solid var(--border);
      color: var(--text-muted);
    }
    .step.active {
      background: rgba(59, 130, 246, 0.12);
      border-color: rgba(59, 130, 246, 0.25);
      color: var(--text);
    }
    .step span {
      display: inline-flex;
      width: 2rem;
      height: 2rem;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      border-radius: 999px;
      background: var(--surface);
      margin-bottom: 0.75rem;
      border: 1px solid var(--border);
    }
    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }
    .details-card {
      padding: 1.5rem;
      border-radius: var(--radius);
      background: #ffffff;
      border: 1px solid var(--border);
    }
    .details-card h3 {
      margin-bottom: 1rem;
      color: var(--primary);
    }
    .details-card p {
      margin-bottom: 0.85rem;
      color: var(--text-muted);
    }
    .comment {
      margin-top: 1.75rem;
      background: rgba(15, 23, 42, 0.05);
      padding: 1.5rem;
      border-radius: var(--radius);
    }
    .alert-error {
      margin-top: 1.75rem;
      padding: 1rem;
      background: #fef2f2;
      color: var(--error);
      border-radius: var(--radius);
    }
    .text-center { text-align: center; }
  `]
})
export class TrackingComponent implements OnInit {
  numero = '';
  candidature?: Candidature;
  loading = false;
  error = '';
  currentStep = 1;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute
  ) {}

  getStatusClass(status?: string) {
    return status ? status.replace(/\s+/g, '_') : 'EN_COURS';
  }

  ngOnInit() {
    const num = this.route.snapshot.params['numero'];
    if (num) {
      this.numero = num;
      this.rechercher();
    }
  }

  rechercher() {
    if (!this.numero) {
      this.error = 'Veuillez saisir un numéro de candidature.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.candidature = undefined;

    this.api.suivreCandidature(this.numero).subscribe({
      next: (res) => {
        this.candidature = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Candidature non trouvée.';
        this.loading = false;
      }
    });
  }
}
