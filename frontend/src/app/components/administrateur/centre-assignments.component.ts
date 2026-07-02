import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Candidature, Centre } from '../../models/models';

interface AssignmentView {
  candidature: Candidature;
  salleLabel: string;
  salleOptions: Array<{ id?: number; label: string }>;
  selectedSalleId?: number;
}

@Component({
  selector: 'app-centre-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="management-shell">
      <div class="hero-card">
        <div>
          <p class="eyebrow">Affectation automatique</p>
          <h2>Gestion des candidats par centre et par salle</h2>
          <p>Visualisez les candidats déjà affectés à leur centre après validation, puis modifiez la salle manuellement si nécessaire.</p>
        </div>
        <div class="hero-pill">{{ centres.length }} centres</div>
      </div>

      <div class="filter-row">
        <label class="field">
          <span>Centre</span>
          <select [(ngModel)]="selectedCentreId" (change)="loadAssignments()">
            <option [ngValue]="undefined">Sélectionner un centre</option>
            <option *ngFor="let centre of centres" [ngValue]="centre.id">{{ centre.nom }} · {{ centre.ville }}</option>
          </select>
        </label>
      </div>

      <div class="panel" *ngIf="!selectedCentreId">
        <p class="empty-state">Choisissez un centre pour afficher les candidats et leurs salles.</p>
      </div>

      <div class="panel" *ngIf="selectedCentreId && loading">
        <p class="empty-state">Chargement des affectations...</p>
      </div>

      <div class="panel" *ngIf="selectedCentreId && !loading && assignments.length === 0">
        <p class="empty-state">Aucun candidat n’est encore affecté à ce centre.</p>
      </div>

      <div class="assignment-list" *ngIf="selectedCentreId && !loading && assignments.length > 0">
        <article class="assignment-card" *ngFor="let item of assignments">
          <div class="candidate-info">
            <h3>{{ item.candidature.candidat.prenom }} {{ item.candidature.candidat.nom }}</h3>
            <p><strong>CIN :</strong> {{ item.candidature.candidat.cin }}</p>
            <p><strong>Spécialité :</strong> {{ item.candidature.specialite.nom || 'Non renseignée' }}</p>
            <p><strong>Statut :</strong> {{ item.candidature.statut || 'Validé' }}</p>
          </div>

          <div class="room-block">
            <label class="field">
              <span>Salle actuelle</span>
              <select [(ngModel)]="item.selectedSalleId" (change)="changeSalle(item)">
                <option [ngValue]="undefined">Aucune salle</option>
                <option *ngFor="let salle of item.salleOptions" [ngValue]="salle.id">{{ salle.label }}</option>
              </select>
            </label>
            <p class="helper">{{ item.salleLabel }}</p>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .management-shell {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .hero-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem 1.75rem;
      border: 1px solid var(--border);
      border-radius: 18px;
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(255,255,255,0.95));
    }
    .eyebrow {
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--primary);
      margin-bottom: 0.3rem;
    }
    .hero-pill {
      padding: 0.8rem 1rem;
      border-radius: 999px;
      background: var(--primary);
      color: #fff;
      font-weight: 700;
      white-space: nowrap;
    }
    .filter-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      align-items: flex-end;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .field select {
      min-width: 280px;
      padding: 0.9rem 1rem;
      border: 1px solid var(--border);
      border-radius: 12px;
      font-size: 1rem;
      background: #fff;
    }
    .panel {
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 1.2rem;
      background: var(--surface);
    }
    .empty-state {
      padding: 0.8rem 0;
      color: var(--text-muted);
      margin: 0;
    }
    .assignment-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .assignment-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.2rem;
      border: 1px solid var(--border);
      border-radius: 16px;
      background: rgba(248,250,252,0.85);
    }
    .candidate-info h3 {
      margin: 0 0 0.3rem;
    }
    .candidate-info p {
      margin: 0.15rem 0;
      color: var(--text-muted);
    }
    .room-block {
      min-width: 240px;
    }
    .helper {
      margin-top: 0.35rem;
      font-size: 0.95rem;
      color: var(--primary);
      font-weight: 600;
    }
    @media (max-width: 900px) {
      .assignment-card {
        flex-direction: column;
        align-items: stretch;
      }
      .room-block {
        min-width: auto;
      }
      .hero-card {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class CentreAssignmentsComponent implements OnInit {
  centres: Centre[] = [];
  assignments: AssignmentView[] = [];
  selectedCentreId?: number;
  loading = false;
  saving = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadCentres();
  }

  loadCentres(): void {
    this.api.getAdminCentres().subscribe({
      next: (res) => {
        this.centres = res.data || [];
        if (this.centres.length) {
          this.selectedCentreId = this.centres[0].id;
          this.loadAssignments();
        }
      }
    });
  }

  loadAssignments(): void {
    if (!this.selectedCentreId) {
      this.assignments = [];
      return;
    }

    this.loading = true;
    this.api.getSallesWithCandidates(this.selectedCentreId).subscribe({
      next: (res) => {
        const payload = res.data || {};
        const candidates = Array.isArray(payload.candidats) ? payload.candidats : [];
        const salles = Array.isArray(payload.salles) ? payload.salles : [];

        this.assignments = candidates.map((candidate: any) => {
          const assignedSalle = candidate.salle || null;
          return {
            candidature: candidate.candidature || candidate,
            salleLabel: assignedSalle ? `Salle actuelle : ${assignedSalle.nom || assignedSalle.libelle || assignedSalle}` : 'Aucune salle assignée',
            salleOptions: salles.map((salle: any) => ({ id: salle.id, label: salle.nom || salle.libelle || `Salle ${salle.id}` })),
            selectedSalleId: assignedSalle?.id
          } as AssignmentView;
        });
        this.loading = false;
      },
      error: () => {
        this.assignments = [];
        this.loading = false;
      }
    });
  }

  changeSalle(item: AssignmentView): void {
    if (!item.candidature.id) return;

    this.saving = true;
    this.api.assignSalle(item.candidature.id, item.selectedSalleId).subscribe({
      next: () => {
        const selected = item.salleOptions.find((s) => s.id === item.selectedSalleId);
        item.salleLabel = selected ? `Salle actuelle : ${selected.label}` : 'Aucune salle assignée';
        this.saving = false;
      },
      error: () => {
        this.saving = false;
      }
    });
  }
}
