import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container fade-in">
      <header class="hero">
        <h1 class="font-outfit">Plateforme de Recrutement</h1>
        <p>Gérez vos candidatures aux concours nationaux en toute simplicité et transparence.</p>
      </header>

      <div class="grid">
        <div class="glass-card action-card">
          <div class="icon">📝</div>
          <h2 class="font-outfit">Nouvelle Candidature</h2>
          <p>Remplissez le formulaire pour vous inscrire à un concours en cours.</p>
          <button class="btn btn-primary" routerLink="/postuler">Commencer l'inscription</button>
        </div>

        <div class="glass-card action-card">
          <div class="icon">🔍</div>
          <h2 class="font-outfit">Suivi de Dossier</h2>
          <p>Consultez l'état d'avancement de votre candidature à l'aide de votre numéro unique.</p>
          <button class="btn btn-secondary" routerLink="/suivi">Suivre mon dossier</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hero {
      text-align: center;
      margin: 4rem 0;
    }
    .hero h1 {
      font-size: 3.5rem;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero p {
      font-size: 1.25rem;
      color: var(--text-muted);
      max-width: 600px;
      margin: 0 auto;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }
    .action-card {
      padding: 3rem;
      text-align: center;
      transition: transform 0.3s ease;
    }
    .action-card:hover {
      transform: translateY(-5px);
    }
    .icon {
      font-size: 3rem;
      margin-bottom: 1.5rem;
    }
    .action-card h2 {
      margin-bottom: 1rem;
    }
    .action-card p {
      margin-bottom: 2rem;
      color: var(--text-muted);
    }
    .btn {
      width: 100%;
    }
  `]
})
export class HomeComponent {}
