import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { UserBase, Centre } from '../../models/models';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-section">
      <div class="section-header">
        <h2>Gestion des Comptes Utilisateurs</h2>
        <p>Créez, modifiez et supprimez les comptes utilisateurs de la plateforme.</p>
      </div>

      <!-- Users List Table -->
      <section class="table-section">
        <h3>Liste des utilisateurs</h3>
        <div *ngIf="loadingUsers" class="loading-state">
          <div class="spinner"></div>
          <p>Chargement des utilisateurs...</p>
        </div>
        <div *ngIf="!loadingUsers && users.length === 0" class="empty-state">
          <p>Aucun utilisateur trouvé.</p>
        </div>
        <table *ngIf="!loadingUsers && users.length > 0" class="users-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Centre</th>
              <th>État</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users" [class.editing]="editingUser?.id === user.id">
              <td>{{ user.nom }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span *ngIf="editingUser?.id !== user.id" class="role-badge" [ngClass]="getRoleClass(user.role)">
                  {{ user.role }}
                </span>
                <ng-container *ngIf="editingUser?.id === user.id && editingUser as edit">
                  <select [(ngModel)]="edit.role" class="role-select">
                    <option>Gestionnaire local</option>
                    <option>Gestionnaire global</option>
                    <option>Administrateur</option>
                  </select>
                </ng-container>
              </td>
              <td>
                <span *ngIf="editingUser?.id !== user.id">{{ user.centre?.nom || '-' }}</span>
                <select *ngIf="editingUser?.id === user.id && editingUser as edit" [(ngModel)]="edit.centreId" [disabled]="edit.role !== 'Gestionnaire local'">
                  <option [ngValue]="undefined">-- aucun --</option>
                  <option *ngFor="let centre of centres" [ngValue]="centre.id">{{ centre.nom }} · {{ centre.ville }}</option>
                </select>
              </td>
              <td><span class="state-badge" [class.inactive]="user.actif === false">{{ user.actif === false ? 'Inactif' : 'Actif' }}</span></td>
              <td class="actions-cell">
                <button 
                  *ngIf="editingUser?.id !== user.id"
                  class="btn btn-primary btn-sm" 
                  (click)="startEdit(user)"
                  title="Éditer">
                  ✏️ Éditer
                </button>
                <button 
                  *ngIf="editingUser?.id === user.id"
                  class="btn btn-success btn-sm" 
                  (click)="saveEditedUser()"
                  [disabled]="updatingUserId === user.id"
                  title="Sauvegarder">
                  ✓ Sauvegarder
                </button>
                <button 
                  *ngIf="editingUser?.id === user.id"
                  class="btn btn-secondary btn-sm" 
                  (click)="cancelEdit()"
                  title="Annuler">
                  ✕ Annuler
                </button>
                <button 
                  class="btn btn-danger btn-sm" 
                  (click)="deleteUser(user.id!)"
                  [disabled]="deletingUserId === user.id"
                  title="Supprimer">
                  🚫 Désactiver
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Create New User Form -->
      <section class="create-user-section">
        <h3>Créer un Compte Utilisateur</h3>
        <form (ngSubmit)="createUser()" class="user-form">
          <div class="form-row">
            <div class="form-group">
              <label for="nom">Nom *</label>
              <input 
                id="nom"
                type="text" 
                [(ngModel)]="newUser.nom"
                name="nom"
                placeholder="Nom complet"
                class="form-control"
                [class.error]="newUserErrors['nom']">
              <span class="error-message" *ngIf="newUserErrors['nom']">{{ newUserErrors['nom'] }}</span>
            </div>

            <div class="form-group">
              <label for="email">Email *</label>
              <input 
                id="email"
                type="email" 
                [(ngModel)]="newUser.email"
                name="email"
                placeholder="email@domaine.com"
                class="form-control"
                [class.error]="newUserErrors['email']">
              <span class="error-message" *ngIf="newUserErrors['email']">{{ newUserErrors['email'] }}</span>
            </div>

            <div class="form-group">
              <label for="role">Rôle *</label>
              <select 
                id="role"
                [(ngModel)]="newUser.role"
                name="role"
                class="form-control"
                [class.error]="newUserErrors['role']">
                <option>Gestionnaire local</option>
                <option>Gestionnaire global</option>
                <option>Administrateur</option>
              </select>
              <span class="error-message" *ngIf="newUserErrors['role']">{{ newUserErrors['role'] }}</span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="password">Mot de passe *</label>
              <input 
                id="password"
                type="password" 
                [(ngModel)]="newUser.password"
                name="password"
                placeholder="Mot de passe (min. 6 caractères)"
                class="form-control"
                [class.error]="newUserErrors['password']">
              <span class="error-message" *ngIf="newUserErrors['password']">{{ newUserErrors['password'] }}</span>
            </div>

            <div class="form-group" *ngIf="centres.length > 0">
              <label for="centre">Centre (pour gestionnaire local)</label>
              <select 
                id="centre"
                [(ngModel)]="newUser.centreId"
                name="centreId"
                class="form-control"
                [disabled]="newUser.role !== 'Gestionnaire local'">
                <option [ngValue]="undefined">-- aucun --</option>
                <option *ngFor="let c of centres" [ngValue]="c.id">{{ c.nom }} - {{ c.ville }}</option>
              </select>
              <span class="error-message" *ngIf="newUserErrors['centreId']">{{ newUserErrors['centreId'] }}</span>
            </div>
          </div>

          <div class="form-actions">
            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="creatingUser">
              <span *ngIf="!creatingUser">➕ Créer un Compte</span>
              <span *ngIf="creatingUser">Création en cours...</span>
            </button>
          </div>

          <div *ngIf="createMessage" [ngClass]="createMessageType" class="alert-message">
            {{ createMessage }}
          </div>
        </form>
      </section>
    </div>
  `,
  styles: [`
    .users-section {
      animation: fadeIn 0.3s ease;
    }
    .section-header {
      margin-bottom: 2rem;
    }
    .section-header h2 {
      margin-bottom: 0.5rem;
    }
    .section-header p {
      color: var(--text-muted);
    }
    .table-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    .table-section h3 {
      margin-bottom: 1.5rem;
      color: var(--text);
    }
    .users-table {
      width: 100%;
      border-collapse: collapse;
    }
    .users-table th {
      background: #f8fafc;
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: var(--secondary);
      border-bottom: 2px solid var(--border);
    }
    .users-table td {
      padding: 1rem;
      border-bottom: 1px solid var(--border);
    }
    .users-table tbody tr:hover {
      background: rgba(249, 115, 22, 0.03);
    }
    .users-table tbody tr.editing {
      background: rgba(34, 197, 94, 0.05);
    }
    .role-badge {
      display: inline-block;
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
    }
    .role-badge.local {
      background: rgba(59, 130, 246, 0.15);
      color: #1e40af;
    }
    .role-badge.global {
      background: rgba(168, 85, 247, 0.15);
      color: #6b21a8;
    }
    .role-badge.admin {
      background: rgba(249, 115, 22, 0.15);
      color: #9a3412;
    }
    .role-select {
      padding: 0.5rem;
      border: 1px solid var(--border);
      border-radius: 4px;
    }
    .state-badge { color: var(--success); font-weight: 700; }
    .state-badge.inactive { color: var(--error); }
    .actions-cell {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .btn-sm {
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
      white-space: nowrap;
    }
    .create-user-section {
      padding: 1.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    .create-user-section h3 {
      margin-bottom: 1.5rem;
    }
    .user-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
    }
    .form-group label {
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--text);
    }
    .form-control {
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }
    .form-control:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
    }
    .form-control.error {
      border-color: #dc2626;
    }
    .error-message {
      color: #dc2626;
      font-size: 0.85rem;
      margin-top: 0.35rem;
    }
    .form-actions {
      display: flex;
      gap: 1rem;
    }
    .alert-message {
      padding: 1rem;
      border-radius: 4px;
      font-weight: 500;
    }
    .alert-message.success {
      background: rgba(34, 197, 94, 0.15);
      color: #15803d;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }
    .alert-message.error {
      background: rgba(220, 38, 38, 0.15);
      color: #991b1b;
      border: 1px solid rgba(220, 38, 38, 0.3);
    }
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
    }
    .spinner {
      width: 30px;
      height: 30px;
      border: 3px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .empty-state {
      padding: 2rem;
      text-align: center;
      color: var(--text-muted);
    }
    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
      .actions-cell {
        flex-direction: column;
      }
      .btn-sm {
        width: 100%;
      }
    }
  `]
})
export class UserManagementComponent implements OnInit {
  users: UserBase[] = [];
  centres: Centre[] = [];
  editingUser: Partial<UserBase & { password?: string; centreId?: number }> | null = null;
  editingUserOriginal: Partial<UserBase> | null = null;

  newUser: Partial<UserBase & { password?: string; centreId?: number }> = {
    nom: '',
    email: '',
    role: 'Gestionnaire local',
    password: ''
  };

  loadingUsers = false;
  creatingUser = false;
  updatingUserId: number | null = null;
  deletingUserId: number | null = null;
  newUserErrors: { [key: string]: string } = {};
  createMessage = '';
  createMessageType = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadCentres();
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.api.getUsers().subscribe({
      next: (res) => {
        this.users = res.data || [];
        this.loadingUsers = false;
      },
      error: () => {
        this.createMessage = 'Erreur lors du chargement des utilisateurs.';
        this.createMessageType = 'error';
        this.loadingUsers = false;
      }
    });
  }

  loadCentres(): void {
    this.api.getAdminCentres().subscribe({
      next: (res) => {
        this.centres = res.data || [];
      },
      error: () => {
        // Silently fail if centres cannot be loaded
      }
    });
  }

  startEdit(user: UserBase): void {
    this.editingUserOriginal = JSON.parse(JSON.stringify(user));
    const editingUser = JSON.parse(JSON.stringify(user)) as Partial<UserBase & { password?: string; centreId?: number }>;
    editingUser.role = this.roleLabel(user.role as string) as any;
    editingUser.centreId = user.centre?.id;
    this.editingUser = editingUser;
  }

  cancelEdit(): void {
    this.editingUser = null;
    this.editingUserOriginal = null;
  }

  saveEditedUser(): void {
    if (!this.editingUser || !this.editingUser.id) return;

    if (this.editingUser.role === 'Gestionnaire local' && !this.editingUser.centreId) {
      this.createMessage = 'Un gestionnaire local doit être rattaché à un centre.';
      this.createMessageType = 'error';
      return;
    }
    const payload: any = {
      nom: this.editingUser.nom,
      prenom: (this.editingUser as any).prenom || '',
      email: this.editingUser.email,
      role: this.mapRoleToEnum(this.editingUser.role as string),
      centreId: (this.editingUser as any).centreId
    };

    this.updatingUserId = this.editingUser.id;
    this.api.updateUser(this.editingUser.id, payload).subscribe({
      next: () => {
        this.createMessage = `Utilisateur ${this.editingUser!.nom} mis à jour avec succès.`;
        this.createMessageType = 'success';
        this.editingUser = null;
        this.editingUserOriginal = null;
        this.updatingUserId = null;
        this.loadUsers();
      },
      error: () => {
        this.createMessage = 'Erreur lors de la mise à jour de l\'utilisateur.';
        this.createMessageType = 'error';
        this.updatingUserId = null;
      }
    });
  }

  deleteUser(userId: number): void {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;

    const confirmed = window.confirm(`Désactiver le compte de ${user.nom} ? Il ne pourra plus se connecter.`);
    if (!confirmed) return;

    this.deletingUserId = userId;
    this.api.deleteUser(userId).subscribe({
      next: () => {
        this.createMessage = `${user.nom} a été désactivé.`;
        this.createMessageType = 'success';
        this.deletingUserId = null;
        this.loadUsers();
      },
      error: () => {
        this.createMessage = 'Erreur lors de la suppression de l\'utilisateur.';
        this.createMessageType = 'error';
        this.deletingUserId = null;
      }
    });
  }

  validateNewUser(): boolean {
    this.newUserErrors = {};

    if (!this.newUser.nom || (this.newUser.nom as string).trim().length < 2) {
      this.newUserErrors['nom'] = 'Veuillez fournir un nom valide.';
    }
    if (!this.newUser.email || !(this.newUser.email as string).includes('@')) {
      this.newUserErrors['email'] = 'Veuillez fournir un email valide.';
    }
    if (!this.newUser.role) {
      this.newUserErrors['role'] = 'Veuillez choisir un rôle.';
    }
    if (this.newUser.role === 'Gestionnaire local' && !this.newUser.centreId) {
      this.newUserErrors['centreId'] = 'Un gestionnaire local nécessite un centre.';
    }
    if (!this.newUser.password || (this.newUser.password as string).length < 6) {
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

  getRoleClass(role: string | null | undefined): string {
    if (!role) return '';
    const label = (role as string).toLowerCase();
    if (label.includes('local')) return 'local';
    if (label.includes('global')) return 'global';
    if (label.includes('administr') || label === 'admin') return 'admin';
    return '';
  }

  private roleLabel(role: string): string {
    if (role === 'GESTIONNAIRE_LOCAL') return 'Gestionnaire local';
    if (role === 'GESTIONNAIRE_GLOBAL') return 'Gestionnaire global';
    if (role === 'ADMIN') return 'Administrateur';
    return role;
  }

  createUser(): void {
    if (!this.validateNewUser()) {
      this.createMessage = 'Veuillez corriger les erreurs du formulaire.';
      this.createMessageType = 'error';
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
        this.createMessageType = 'success';
        this.newUser = { nom: '', email: '', role: 'Gestionnaire local', password: '' };
        this.creatingUser = false;
        this.loadUsers();
      },
      error: (err) => {
        this.createMessage = err?.error?.message || 'Erreur lors de la création de l\'utilisateur.';
        this.createMessageType = 'error';
        this.creatingUser = false;
      }
    });
  }
}
