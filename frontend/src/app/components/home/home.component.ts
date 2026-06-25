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

      <section class="api-docs-card">
        <div class="glass-card overview-card">
          <h2>Documentation API</h2>
          <p>Base URL : <code>http://localhost:8080/api/v1</code></p>
          <p>Swagger UI : <a target="_blank" rel="noopener" href="http://localhost:8080/swagger-ui/index.html">http://localhost:8080/swagger-ui/index.html</a></p>
          <p>Comptes de test :</p>
          <ul>
            <li><strong>Admin :</strong> admin&#64;competition.com / admin123</li>
            <li><strong>Gestionnaire global :</strong> global&#64;competition.com / global123</li>
            <li><strong>Gestionnaire local :</strong> local&#64;competition.com / local123</li>
          </ul>
          <p>Endpoints publics :</p>
          <ul>
            <li><strong>Soumettre une candidature :</strong> POST <code>/api/v1/public/postuler</code></li>
            <li><strong>Suivre une candidature :</strong> GET <code>/api/v1/public/suivi/&#123;numero&#125;</code></li>
            <li><strong>Liste des centres :</strong> GET <code>/api/v1/public/centres</code></li>
            <li><strong>Liste des concours :</strong> GET <code>/api/v1/public/concours</code></li>
            <li><strong>Liste des spécialités :</strong> GET <code>/api/v1/public/specialites</code></li>
          </ul>
          <p>Connexion :</p>
          <ul>
            <li><strong>Authentification :</strong> POST <code>/api/v1/auth/login</code></li>
          </ul>
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
            <h3>{{ concours.nom }}</h3>
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
    .api-docs-card {
      margin-top: 1.5rem;
    }
    .api-docs-card code {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 0.35rem;
      background: rgba(15, 23, 42, 0.05);
      color: var(--text);
      font-size: 0.95rem;
    }
    .api-docs-card a {
      color: var(--primary);
      text-decoration: none;
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
      background: rgba(249, 115, 22, 0.12);
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
      nom: 'Concours d’entrée 2026',
      description: 'Recrutement national pour des spécialités en informatique, gestion et marketing.',
      dateConcours: '2026-09-25',
      dateDebutInscription: '2026-05-01',
      dateFinInscription: '2026-09-10',
      statut: 'Ouvert'
    },
    {
      id: 2,
      nom: 'Concours de la fonction publique',
      description: 'Sélection des meilleurs profils pour les centres de Rabat et Casablanca.',
      dateConcours: '2026-11-15',
      dateDebutInscription: '2026-07-01',
      dateFinInscription: '2026-11-01',
      statut: 'Prochain'
    }
  ];
}
