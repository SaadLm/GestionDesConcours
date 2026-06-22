import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Candidature, ApiResponse } from '../../models/models';

@Component({
  selector: 'app-gestionnaire-local',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container fade-in">
      <div class="hero local-hero">
        <h1 class="font-outfit">Tableau de bord Gestionnaire local</h1>
        <p>Accédez aux candidatures de votre centre, évaluez les dossiers et suivez les places disponibles par spécialité.</p>
      </div>

      <div class="cards-grid">
        <div class="glass-card summary-card">
          <h2>Fonctionnalités clés</h2>
          <ul>
            <li>Accéder aux candidatures liées à leur centre</li>
            <li>Valider ou rejeter selon l’adéquation diplôme/concours</li>
            <li>Communiquer avec les candidats</li>
            <li>Gérer les places disponibles par spécialité</li>
          </ul>
        </div>
        <div class="glass-card summary-card">
          <h2>Centre</h2>
          <p><strong>Centre Casablanca</strong></p>
          <p>Spécialités gérées : Informatique, Gestion</p>
          <p>Places restantes : 24</p>
        </div>
      </div>

      <section class="table-section">
        <h2>Candidatures du centre</h2>
        <div *ngIf="loading">Chargement des candidatures…</div>
        <table *ngIf="!loading">
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Candidat</th>
              <th>Concours</th>
              <th>Spécialité</th>
              <th>Statut</th>
              <th>Commentaire</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let candidature of candidatures">
              <td>{{ candidature.numeroCandidature || candidature.id }}</td>
              <td>{{ candidature.candidat.nom }} {{ candidature.candidat.prenom }}</td>
              <td>{{ candidature.concours.titre }}</td>
              <td>{{ candidature.specialite.nom }}</td>
              <td><span class="status {{ (candidature.statut || '').toLowerCase() }}">{{ candidature.statut || 'En cours' }}</span></td>
              <td>{{ candidature.commentaire }}</td>
              <td>
                <button class="btn btn-success" (click)="valider(candidature)">Valider</button>
                <button class="btn btn-danger" (click)="rejeter(candidature)">Rejeter</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="places-card">
        <h2>Places disponibles par spécialité</h2>
        <div class="place-row" *ngFor="let place of places">
          <div>
            <strong>{{ place.specialite }}</strong>
            <p>{{ place.description }}</p>
          </div>
          <div class="badge">{{ place.disponible }} places</div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .local-hero {
      margin-bottom: 2rem;
    }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .summary-card {
      padding: 1.75rem;
      min-height: 220px;
    }
    .summary-card ul {
      padding-left: 1.2rem;
      line-height: 1.75;
      color: var(--text-muted);
    }
    .table-section {
      margin-top: 2rem;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--surface);
      border: 1px solid var(--border);
    }
    th, td {
      padding: 1rem;
      border-bottom: 1px solid var(--border);
      text-align: left;
    }
    th {
      background: #f8fafc;
      color: var(--secondary);
    }
    .status {
      display: inline-flex;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .status.validée,
    .status.validée {
      background: #ecfdf5;
      color: #166534;
    }
    .status.rejetée {
      background: #fef2f2;
      color: #991b1b;
    }
    .status.en cours {
      background: #eff6ff;
      color: #1d4ed8;
    }
    .places-card {
      margin-top: 2rem;
      padding: 1.75rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    .place-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid var(--border);
    }
    .place-row:last-child {
      border-bottom: none;
    }
    .badge {
      background: rgba(59, 130, 246, 0.12);
      color: var(--primary);
      padding: 0.5rem 0.85rem;
      border-radius: 999px;
      font-weight: 700;
    }
    @media (max-width: 760px) {
      table {
        font-size: 0.95rem;
      }
      .place-row {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class GestionnaireLocalComponent {
  candidatures: Candidature[] = [];

  places = [
    { specialite: 'Informatique', description: 'Places disponibles pour le centre Casablanca.', disponible: 12 },
    { specialite: 'Gestion', description: 'Places restantes pour le centre Casablanca.', disponible: 8 }
  ];

  loading = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadCandidatures();
  }

  private loadCandidatures(): void {
    this.loading = true;
    this.api.getCandidatures().subscribe({
      next: (res: ApiResponse<Candidature[]>) => {
        this.candidatures = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load candidatures', err);
        this.loading = false;
      }
    });
  }

  valider(cand: Candidature): void {
    if (!cand.id) return;
    this.api.validerCandidature(cand.id).subscribe({
      next: () => {
        cand.statut = 'Validée';
      },
      error: (err) => console.error('Valider failed', err)
    });
  }

  rejeter(cand: Candidature): void {
    if (!cand.id) return;
    const commentaire = prompt('Motif du rejet (optionnel) :') || '';
    this.api.rejeterCandidature(cand.id, commentaire).subscribe({
      next: () => {
        cand.statut = 'Rejetée';
        cand.commentaire = commentaire;
      },
      error: (err) => console.error('Rejeter failed', err)
    });
  }
}
