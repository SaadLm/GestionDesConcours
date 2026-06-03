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
        <h2 class="font-outfit text-center">Suivre ma candidature</h2>
        
        <div class="search-box">
          <input type="text" [(ngModel)]="numero" placeholder="Ex: CAND-2026-XXXXXX" (keyup.enter)="rechercher()">
          <button class="btn btn-primary" (click)="rechercher()" [disabled]="loading">Chercher</button>
        </div>

        <div *ngIf="candidature" class="result fade-in">
          <div class="status-header" [ngClass]="candidature.statut">
            <div class="badge">{{ candidature.statut }}</div>
            <p><strong>Candidature N°:</strong> {{ candidature.numeroCandidature }}</p>
          </div>

          <div class="details">
            <p><strong>Candidat :</strong> {{ candidature.candidat.nom }} {{ candidature.candidat.prenom }}</p>
            <p><strong>Concours :</strong> {{ candidature.concours.titre }}</p>
            <p><strong>Spécialité :</strong> {{ candidature.specialite.nom }}</p>
            <p><strong>Centre :</strong> {{ candidature.centre.nom }}</p>
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
      max-width: 600px;
      margin: 2rem auto;
      padding: 3rem;
    }
    .search-box {
      margin-top: 2rem;
      display: flex;
      gap: 0.5rem;
    }
    .result {
      margin-top: 3rem;
      border-top: 2px solid var(--border);
      padding-top: 2rem;
    }
    .status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
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
    .status-header.EN_ATTENTE { background: #fffbeb; border: 1px solid #fde68a; }
    .status-header.EN_ATTENTE .badge { background: #fbbf24; color: #78350f; }
    
    .status-header.VALIDEE { background: #ecfdf5; border: 1px solid #a7f3d0; }
    .status-header.VALIDEE .badge { background: #10b981; color: #064e3b; }

    .status-header.REJETEE { background: #fef2f2; border: 1px solid #fee2e2; }
    .status-header.REJETEE .badge { background: #ef4444; color: #7f1d1d; }

    .details p { margin-bottom: 0.75rem; }
    .comment {
      margin-top: 2rem;
      background: rgba(0,0,0,0.05);
      padding: 1.5rem;
      border-radius: var(--radius);
    }
    .alert-error {
      margin-top: 2rem;
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

  constructor(
    private api: ApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const num = this.route.snapshot.params['numero'];
    if (num) {
      this.numero = num;
      this.rechercher();
    }
  }

  rechercher() {
    if (!this.numero) return;
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
