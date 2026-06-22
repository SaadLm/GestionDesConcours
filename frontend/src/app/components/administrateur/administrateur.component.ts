import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface UserAccount {
  id: number;
  nom: string;
  email: string;
  role: string;
}

interface SettingsItem {
  label: string;
  value: boolean;
}

@Component({
  selector: 'app-administrateur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container fade-in">
      <div class="hero admin-hero">
        <h1 class="font-outfit">Tableau de bord Administrateur</h1>
        <p>Gestion complète de la plateforme : comptes, rôles, paramètres et supervision globale des concours.</p>
      </div>

      <div class="cards-grid">
        <div class="glass-card summary-card">
          <h2>Fonctionnalités clés</h2>
          <ul>
            <li>Gestion des comptes utilisateurs</li>
            <li>Création, modification et suppression des comptes</li>
            <li>Gestion des rôles et des droits d’accès</li>
            <li>Configuration générale de la plateforme</li>
          </ul>
        </div>
        <div class="glass-card summary-card">
          <h2>Paramètres administratifs</h2>
          <ul>
            <li>Rôles disponibles : Local, Global, Administrateur</li>
            <li>Paramètres de validation activés</li>
            <li>Audit des connexions et accès</li>
          </ul>
        </div>
      </div>

      <section class="table-section">
        <h2>Gestion des comptes utilisateurs</h2>
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users; let i = index">
              <td>{{ user.nom }}</td>
              <td>{{ user.email }}</td>
              <td>
                <select [(ngModel)]="user.role">
                  <option>Gestionnaire local</option>
                  <option>Gestionnaire global</option>
                  <option>Administrateur</option>
                </select>
              </td>
              <td>
                <button class="btn btn-primary btn-sm" (click)="saveUser(user)">Sauvegarder</button>
                <button class="btn btn-secondary btn-sm" (click)="deleteUser(i)">Supprimer</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="create-user-card">
        <h2>Créer un compte utilisateur</h2>
        <div class="input-grid">
          <div class="input-group">
            <label>Nom</label>
            <input type="text" [(ngModel)]="newUser.nom" placeholder="Nom complet">
          </div>
          <div class="input-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="newUser.email" placeholder="email@domaine.com">
          </div>
          <div class="input-group">
            <label>Rôle</label>
            <select [(ngModel)]="newUser.role">
              <option>Gestionnaire local</option>
              <option>Gestionnaire global</option>
              <option>Administrateur</option>
            </select>
          </div>
        </div>
        <button class="btn btn-primary" type="button" (click)="createUser()">Créer un compte</button>
        <p *ngIf="createMessage" class="alert alert-info">{{ createMessage }}</p>
      </section>

      <section class="settings-card">
        <h2>Configuration générale</h2>
        <div class="settings-grid">
          <div class="setting-item" *ngFor="let setting of settings">
            <label>
              <input type="checkbox" [(ngModel)]="setting.value">
              {{ setting.label }}
            </label>
          </div>
        </div>
        <button class="btn btn-primary" type="button" (click)="saveSettings()">Enregistrer les paramètres</button>
        <p *ngIf="settingsMessage" class="alert alert-info">{{ settingsMessage }}</p>
      </section>
    </div>
  `,
  styles: [`
    .admin-hero {
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
    .table-section,
    .create-user-card,
    .settings-card {
      margin-top: 2rem;
      padding: 1.75rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }
    th, td {
      padding: 1rem;
      border-bottom: 1px solid var(--border);
      text-align: left;
      vertical-align: middle;
    }
    th {
      background: #f8fafc;
      color: var(--secondary);
    }
    .btn-sm {
      padding: 0.45rem 0.85rem;
      font-size: 0.85rem;
      margin-right: 0.5rem;
    }
    .input-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .settings-grid {
      display: grid;
      gap: 0.85rem;
      margin-bottom: 1rem;
    }
    .setting-item label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .alert-info {
      margin-top: 1rem;
      padding: 0.85rem 1rem;
      border-radius: var(--radius);
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #93c5fd;
    }
    @media (max-width: 760px) {
      .btn-sm {
        display: block;
        width: 100%;
        margin-bottom: 0.5rem;
      }
    }
  `]
})
export class AdministrateurComponent {
  users: UserAccount[] = [
    { id: 1, nom: 'Nadia Choukri', email: 'nadia@domain.com', role: 'Gestionnaire local' },
    { id: 2, nom: 'Rachid Belkheir', email: 'rachid@domain.com', role: 'Gestionnaire global' },
    { id: 3, nom: 'Sanaa El Amrani', email: 'sanaa@domain.com', role: 'Administrateur' }
  ];

  createMessage = '';
  settingsMessage = '';

  newUser: Partial<UserAccount> = {
    nom: '',
    email: '',
    role: 'Gestionnaire local'
  };

  settings: SettingsItem[] = [
    { label: 'Validation automatique des candidatures', value: false },
    { label: 'Notifications par email activées', value: true },
    { label: 'Suivi des accès administratifs', value: true }
  ];

  createUser() {
    if (!this.newUser.nom || !this.newUser.email || !this.newUser.role) {
      this.createMessage = 'Veuillez remplir tous les champs pour créer un compte.';
      return;
    }

    this.users.push({
      id: this.users.length + 1,
      nom: this.newUser.nom,
      email: this.newUser.email,
      role: this.newUser.role
    } as UserAccount);

    this.createMessage = `Compte créé pour ${this.newUser.nom}.`;
    this.newUser = { nom: '', email: '', role: 'Gestionnaire local' };
  }

  deleteUser(index: number) {
    this.users.splice(index, 1);
    this.createMessage = 'Compte utilisateur supprimé.';
  }

  saveUser(user: UserAccount) {
    this.createMessage = `Rôle mis à jour pour ${user.nom} : ${user.role}.`;
  }

  saveSettings() {
    this.settingsMessage = 'Paramètres de la plateforme enregistrés.';
  }
}
