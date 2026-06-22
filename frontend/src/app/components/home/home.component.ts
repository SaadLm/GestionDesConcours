import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Concours } from '../../models/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container fade-in">
      <header class="hero">
        <h1 class="font-outfit">Ministère de l'Economie et des Finances</h1>
        <p>Bienvenue sur la plateforme nationale de gestion des concours, dédiée à la modernisation du recrutement public et au suivi des candidatures des futures générations de fonctionnaires.</p>
      </header>

      <section class="overview-grid">
        <div class="glass-card overview-card">
          <h2>Pourquoi ce portail ?</h2>
          <p>Cette solution centralise l’inscription, la validation et le suivi des candidatures pour les concours publics, tout en offrant des outils de pilotage aux gestionnaires locaux, globaux et administrateurs.</p>
        </div>

        <div class="glass-card overview-card">
          <h2>Notre mission</h2>
          <p>Accompagner les candidats, améliorer la transparence du processus et garantir une gestion efficace des concours à l’échelle nationale.</p>
        </div>
      </section>

      <section class="available-concours">
        <div class="section-header">
          <div>
            <h2>Concours disponibles</h2>
            <p>Choisissez le concours adapté à votre profil et préparez votre candidature.</p>
          </div>
          <button class="btn btn-primary" routerLink="/postuler">Déposer une candidature</button>
        </div>

        <div class="concours-list">
          <div class="concours-card" *ngFor="let concours of concoursList">
            <div class="concours-label">{{ concours.statut }}</div>
            <h3>{{ concours.titre }}</h3>
            <p>{{ concours.description }}</p>
            <div class="concours-meta">
              <span><strong>Début :</strong> {{ concours.dateDebutInscription }}</span>
              <span><strong>Fin :</strong> {{ concours.dateFinInscription }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .hero {
      margin: 3rem 0 1.5rem;
    }
    .hero h1 {
      font-size: clamp(2.5rem, 4vw, 3.75rem);
      margin-bottom: 1rem;
      color: var(--text);
    }
    .hero p {
      max-width: 760px;
      color: var(--text-muted);
      font-size: 1.05rem;
      line-height: 1.8;
    }
    .overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin: 2.5rem 0;
    }
    .overview-card {
      padding: 2rem;
      min-height: 220px;
    }
    .available-concours {
      margin-top: 2rem;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .concours-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1rem;
    }
    .concours-card {
      padding: 1.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface);
      box-shadow: var(--shadow-sm);
    }
    .concours-label {
      display: inline-flex;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      background: rgba(59, 130, 246, 0.12);
      color: var(--primary);
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.75rem;
      margin-bottom: 1rem;
    }
    .concours-card h3 {
      margin-bottom: 0.65rem;
    }
    .concours-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-top: 1rem;
      color: var(--text-muted);
      font-size: 0.95rem;
    }
  `]
})
export class HomeComponent {
  concoursList: Concours[] = [
    {
      id: 1,
      titre: 'Concours d’entrée 2026',
      description: 'Recrutement national pour des spécialités en informatique, gestion et marketing.',
      dateConcours: '2026-09-25',
      dateDebutInscription: '2026-05-01',
      dateFinInscription: '2026-09-10',
      statut: 'Ouvert'
    },
    {
      id: 2,
      titre: 'Concours de la fonction publique',
      description: 'Sélection des meilleurs profils pour les centres de Rabat et Casablanca.',
      dateConcours: '2026-11-15',
      dateDebutInscription: '2026-07-01',
      dateFinInscription: '2026-11-01',
      statut: 'Prochain'
    }
  ];
}
