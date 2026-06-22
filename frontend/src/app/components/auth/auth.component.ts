import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TEST_ACCOUNTS, getTestAccountByKey } from '../../utils/auth-utils';
import { AuthService } from '../../services/auth.service';

interface TestAccount {
  profile: string;
  email: string;
  password: string;
  description: string;
}

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container fade-in auth-page">
      <div class="auth-header">
        <div>
          <h1 class="font-outfit">Authentification</h1>
          <p>Connectez-vous en tant que gestionnaire local, gestionnaire global ou administrateur pour accéder aux fonctionnalités dédiées.</p>
        </div>
        <div class="test-note">
          <p><strong>Comptes de test :</strong></p>
   
          <ul>
            <li><strong>Gestionnaire local :</strong> "localATtest.gov" / local123</li>
            <li><strong>Gestionnaire global :</strong> "globalATtest.gov" / global123</li>
            <li><strong>Administrateur :</strong> "adminATtest.gov" / admin123</li>
          </ul>
          <p>Appuyez sur un bouton pour remplir automatiquement un compte de test.</p>
        </div>
      </div>

      <div class="grid auth-grid">
        <section class="glass-card auth-card login-card">
          <h2>Connexion de test</h2>
          <form (ngSubmit)="login()">
            <div class="input-group">
              <label>Adresse email</label>
              <input type="email" [(ngModel)]="credentials.email" name="email" placeholder="email@test.gov" required>
            </div>
            <div class="input-group">
              <label>Mot de passe</label>
              <input type="password" [(ngModel)]="credentials.password" name="password" placeholder="••••••••" required>
            </div>
            <button class="btn btn-primary" type="submit">Se connecter</button>
          </form>

          <div class="quick-buttons">
            <button class="btn btn-secondary" type="button" (click)="fillTestAccount('local')">Gestionnaire local</button>
            <button class="btn btn-secondary" type="button" (click)="fillTestAccount('global')">Gestionnaire global</button>
            <button class="btn btn-secondary" type="button" (click)="fillTestAccount('admin')">Administrateur</button>
          </div>

          <div *ngIf="message" class="alert alert-info">
            {{ message }}
          </div>
        </section>

        <section class="glass-card auth-card profile-card">
          <h2>Fonctionnalités par profil</h2>
          <div class="profile-section">
            <h3>Gestionnaire local</h3>
            <ul>
              <li>Accéder aux candidatures liées à leur centre</li>
              <li>Valider ou rejeter les candidatures selon l’adéquation</li>
              <li>Communiquer avec les candidats</li>
              <li>Gérer le nombre de places disponibles par spécialité</li>
            </ul>
          </div>

          <div class="profile-section">
            <h3>Gestionnaire global</h3>
            <ul>
              <li>Accès à l’ensemble des candidatures de tous les centres</li>
              <li>Supervision globale du processus</li>
              <li>Configuration des concours et des spécialités</li>
              <li>Attribution des spécialités aux centres</li>
              <li>Génération de rapports par concours, spécialité et centre</li>
            </ul>
          </div>

          <div class="profile-section">
            <h3>Administrateur</h3>
            <ul>
              <li>Gestion des comptes utilisateurs</li>
              <li>Création, modification et suppression des comptes</li>
              <li>Gestion des rôles et droits d’accès</li>
              <li>Configuration générale de la plateforme</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      padding-bottom: 3rem;
    }
    .auth-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.5rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    .auth-header h1 {
      margin-bottom: 0.75rem;
    }
    .test-note {
      min-width: 280px;
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.25);
      border-radius: var(--radius);
      padding: 1rem 1.25rem;
      color: var(--text);
    }
    .test-note ul {
      margin: 0.75rem 0 0;
      padding-left: 1.25rem;
      color: var(--text-muted);
    }
    .auth-grid {
      display: grid;
      grid-template-columns: 1fr 1.1fr;
      gap: 1.5rem;
    }
    .auth-card {
      padding: 2rem;
    }
    .login-card {
      min-width: 320px;
    }
    .quick-buttons {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
    .profile-section {
      margin-top: 1.5rem;
    }
    .profile-section h3 {
      margin-bottom: 0.75rem;
      color: var(--primary);
    }
    .profile-section ul {
      padding-left: 1.2rem;
      color: var(--text-muted);
      line-height: 1.8;
    }
    .alert-info {
      margin-top: 1.5rem;
      padding: 1rem;
      border-radius: var(--radius);
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #93c5fd;
    }
    @media (max-width: 900px) {
      .auth-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AuthComponent {
  credentials = {
    email: '',
    password: ''
  };

  message = '';

  testAccounts = TEST_ACCOUNTS;

  constructor(private router: Router, private authService: AuthService) {}

  fillTestAccount(key: string) {
    const account = getTestAccountByKey(key);
    if (account) {
      this.credentials.email = account.email;
      this.credentials.password = account.password;
      this.message = `Test automatique rempli pour ${account.profile}.`;
    }
  }

  login() {
    if (!this.credentials.email || !this.credentials.password) {
      this.message = 'Veuillez saisir un email et un mot de passe pour tester la connexion.';
      return;
    }

    this.message = 'Connexion en cours...';
    this.authService.login(this.credentials.email, this.credentials.password).subscribe({
      next: (session) => {
        this.message = `Connexion réussie pour le profil : ${session.profile}.`;
        this.navigateToRolePage(session.profile as string);
      },
      error: (err) => {
        console.error('Login error', err);
        this.message = 'Échec de la connexion. Vérifiez vos identifiants ou le backend.';
      }
    });
  }

  private navigateToRolePage(profile: string) {
    if (profile === 'Gestionnaire local') {
      this.router.navigate(['/gestionnaire-local']);
    } else if (profile === 'Gestionnaire global') {
      this.router.navigate(['/gestionnaire-global']);
    } else if (profile === 'Administrateur') {
      this.router.navigate(['/administrateur']);
    }
  }
}
