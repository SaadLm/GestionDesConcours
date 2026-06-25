import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { UserBase, Centre } from '../../models/models';

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
        <div *ngIf="loadingUsers" class="muted">Chargement des utilisateurs...</div>
        <table *ngIf="!loadingUsers">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
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
                <button class="btn btn-primary btn-sm" (click)="saveUser(user)" [disabled]="updatingUserId===user.id">
                  <span *ngIf="updatingUserId===user.id">Sauvegarde...</span>
                  <span *ngIf="updatingUserId!==user.id">Sauvegarder</span>
                </button>
                <button class="btn btn-secondary btn-sm" (click)="deleteUser(user.id)" [disabled]="deletingUserId===user.id">
                  <span *ngIf="deletingUserId===user.id">Suppression...</span>
                  <span *ngIf="deletingUserId!==user.id">Supprimer</span>
                </button>
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
            <div class="field-error" *ngIf="newUserErrors['nom']">{{ newUserErrors['nom'] }}</div>
          </div>
          <div class="input-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="newUser.email" placeholder="email@domaine.com">
            <div class="field-error" *ngIf="newUserErrors['email']">{{ newUserErrors['email'] }}</div>
          </div>
          <div class="input-group">
            <label>Rôle</label>
            <select [(ngModel)]="newUser.role">
              <option>Gestionnaire local</option>
              <option>Gestionnaire global</option>
              <option>Administrateur</option>
            </select>
            <div class="field-error" *ngIf="newUserErrors['role']">{{ newUserErrors['role'] }}</div>
          </div>
          <div class="input-group">
            <label>Mot de passe</label>
            <input type="password" [(ngModel)]="newUser.password" placeholder="Mot de passe">
            <div class="field-error" *ngIf="newUserErrors['password']">{{ newUserErrors['password'] }}</div>
          </div>

          <div class="input-group" *ngIf="centres.length">
            <label>Centre (pour gestionnaire local)</label>
            <select [(ngModel)]="newUser.centreId">
              <option [ngValue]="undefined">-- aucun --</option>
              <option *ngFor="let c of centres" [ngValue]="c.id">{{ c.nom }} - {{ c.ville }}</option>
            </select>
            <div class="field-error" *ngIf="newUserErrors['centreId']">{{ newUserErrors['centreId'] }}</div>
          </div>
        </div>
        <button class="btn btn-primary" type="button" (click)="createUser()" [disabled]="creatingUser">
          <span *ngIf="creatingUser">Création...</span>
          <span *ngIf="!creatingUser">Créer un compte</span>
        </button>
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
      background: rgba(249, 115, 22, 0.12);
      color: var(--primary);
      border: 1px solid rgba(249, 115, 22, 0.25);
    }
    .field-error {
      color: #b91c1c;
      font-size: 0.9rem;
      margin-top: 0.35rem;
    }
    .muted {
      color: var(--text-muted);
      padding: 0.5rem 0;
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
  users: UserBase[] = [];

  createMessage = '';
  settingsMessage = '';

  newUser: Partial<UserBase & { password?: string; centreId?: number }> = {
    nom: '',
    email: '',
    role: 'Gestionnaire local',
    password: ''
  };

  centres: Centre[] = [];

  // UI states
  loadingUsers = false;
  creatingUser = false;
  updatingUserId: number | null = null;
  deletingUserId: number | null = null;

  newUserErrors: { [key: string]: string } = {};

  settings: SettingsItem[] = [
    { label: 'Validation automatique des candidatures', value: false },
    { label: 'Notifications par email activées', value: true },
    { label: 'Suivi des accès administratifs', value: true }
  ];
  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadCentres();
  }

  loadUsers() {
    this.loadingUsers = true;
    this.api.getUsers().subscribe({
      next: (res) => {
        this.users = res.data || [];
        this.loadingUsers = false;
      },
      error: () => {
        this.createMessage = 'Erreur lors du chargement des utilisateurs.';
        this.loadingUsers = false;
      }
    });
  }

  loadCentres() {
    this.api.getCentres().subscribe({
      next: (res) => {
        this.centres = res.data || [];
      },
      error: () => {
        // ignore non-fatal
      }
    });
  }
  validateNewUser(): boolean {
    this.newUserErrors = {};
    if (!this.newUser.nom || (this.newUser.nom || '').trim().length < 2) {
      this.newUserErrors['nom'] = 'Veuillez fournir un nom valide.';
    }
    if (!this.newUser.email || !String(this.newUser.email).includes('@')) {
      this.newUserErrors['email'] = 'Veuillez fournir un email valide.';
    }
    if (!this.newUser.role) {
      this.newUserErrors['role'] = 'Veuillez choisir un rôle.';
    }
    if (this.newUser.role === 'Gestionnaire local' && !this.newUser.centreId) {
      this.newUserErrors['centreId'] = 'Un gestionnaire local nécessite un centre.';
    }
    if (!this.newUser.password || (this.newUser.password || '').length < 6) {
      this.newUserErrors['password'] = 'Le mot de passe doit contenir au moins 6 caractères.';
    }
    return Object.keys(this.newUserErrors).length === 0;
  }

  mapRoleToEnum(roleLabel: string): string {
    if (!roleLabel) return roleLabel;
    const label = roleLabel.toLowerCase();
    if (label.includes('local')) return 'GESTIONNAIRE_LOCAL';
    if (label.includes('global')) return 'GESTIONNAIRE_GLOBAL';
    if (label.includes('administr')) return 'ADMIN';
    return roleLabel;
  }

  createUser() {
    if (!this.validateNewUser()) {
      this.createMessage = 'Veuillez corriger les erreurs du formulaire.';
      return;
    }

    const payload: any = {
      nom: this.newUser.nom,
      prenom: (this.newUser as any).prenom || '',
      email: this.newUser.email,
      password: this.newUser.password,
      role: this.mapRoleToEnum(this.newUser.role as string),
      centreId: (this.newUser as any).centreId
    };

    this.creatingUser = true;
    this.api.createUser(payload).subscribe({
      next: (res) => {
        this.createMessage = `Compte créé pour ${res.data.nom}.`;
        this.newUser = { nom: '', email: '', role: 'Gestionnaire local', password: '' };
        this.creatingUser = false;
        this.loadUsers();
      },
      error: (err) => {
        this.createMessage = err?.error?.message || 'Erreur lors de la création de l\'utilisateur.';
        this.creatingUser = false;
      }
    });
  }

  deleteUser(userId?: number) {
    if (!userId) return;
    const confirmed = window.confirm('Confirmer la suppression de cet utilisateur ?');
    if (!confirmed) return;
    this.deletingUserId = userId;
    this.api.deleteUser(userId).subscribe({
      next: () => {
        this.createMessage = 'Compte utilisateur supprimé.';
        this.deletingUserId = null;
        this.loadUsers();
      },
      error: () => {
        this.createMessage = 'Erreur lors de la suppression de l\'utilisateur.';
        this.deletingUserId = null;
      }
    });
  }

  saveUser(user: UserBase) {
    if (!user.id) return;
    const payload: any = {
      nom: user.nom,
      prenom: (user as any).prenom || '',
      email: user.email,
      role: this.mapRoleToEnum(user.role as string),
      centreId: (user as any).centreId
    };

    this.updatingUserId = user.id;
    this.api.updateUser(user.id, payload).subscribe({
      next: () => {
        this.createMessage = `Rôle mis à jour pour ${user.nom} : ${user.role}.`;
        this.updatingUserId = null;
        this.loadUsers();
      },
      error: () => {
        this.createMessage = 'Erreur lors de la mise à jour de l\'utilisateur.';
        this.updatingUserId = null;
      }
    });
  }

  saveSettings() {
    this.settingsMessage = 'Paramètres de la plateforme enregistrés.';
  }
}
