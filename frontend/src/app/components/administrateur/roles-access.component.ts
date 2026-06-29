import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { UserBase } from '../../models/models';

interface RolePermission {
  role: string;
  permissions: string[];
  description: string;
  icon: string;
}

@Component({
  selector: 'app-roles-access',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="roles-section">
      <div class="section-header">
        <h2>Gestion des Rôles et Droits d'Accès</h2>
        <p>Définissez et gérez les droits d'accès pour chaque rôle utilisateur.</p>
      </div>

      <!-- Roles Overview -->
      <section class="roles-overview">
        <div class="role-card" *ngFor="let role of roles" [class.expanded]="expandedRole === role.role">
          <div class="role-header" (click)="toggleRoleExpansion(role.role)">
            <div class="role-title">
              <span class="role-icon">{{ role.icon }}</span>
              <div>
                <h3>{{ role.role }}</h3>
                <p class="role-description">{{ role.description }}</p>
              </div>
            </div>
            <span class="toggle-icon">{{ expandedRole === role.role ? '▼' : '▶' }}</span>
          </div>
          
          <div *ngIf="expandedRole === role.role" class="role-details">
            <div class="permissions-list">
              <h4>Droits d'accès</h4>
              <ul>
                <li *ngFor="let perm of role.permissions" class="permission-item">
                  <span class="permission-icon">✓</span>
                  {{ perm }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- User Role Assignment -->
      <section class="assign-roles-section">
        <h3>Attribution des Rôles aux Utilisateurs</h3>
        <div *ngIf="loadingUsers" class="loading-state">
          <div class="spinner"></div>
          <p>Chargement des utilisateurs...</p>
        </div>
        <div *ngIf="!loadingUsers && users.length > 0" class="roles-grid">
          <div class="role-assignment-card" *ngFor="let user of users">
            <div class="card-header">
              <h4>{{ user.nom }}</h4>
              <span class="email">{{ user.email }}</span>
            </div>
            <div class="card-body">
              <label>Rôle Actuel</label>
              <div class="role-display">
                <span class="role-badge" [ngClass]="getRoleClass(user.role)">
                  {{ user.role }}
                </span>
              </div>
              <button 
                class="btn btn-primary btn-sm"
                (click)="openRoleChangeDialog(user)">
                Modifier le rôle
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Access Control Settings -->
      <section class="access-control-section">
        <h3>Paramètres de Contrôle d'Accès</h3>
        <div class="access-settings">
          <div class="setting-item">
            <div class="setting-toggle">
              <label>
                <input type="checkbox" [(ngModel)]="accessSettings.requireMfa">
                <span>Authentification multi-facteurs obligatoire</span>
              </label>
            </div>
            <p class="setting-description">Exiger l'authentification à deux facteurs pour tous les administrateurs</p>
          </div>

          <div class="setting-item">
            <div class="setting-toggle">
              <label>
                <input type="checkbox" [(ngModel)]="accessSettings.auditLogging">
                <span>Enregistrement des accès (audit)</span>
              </label>
            </div>
            <p class="setting-description">Enregistrer toutes les modifications d'utilisateurs et les accès administratifs</p>
          </div>

          <div class="setting-item">
            <div class="setting-toggle">
              <label>
                <input type="checkbox" [(ngModel)]="accessSettings.sessionTimeout">
                <span>Délai d'expiration de session</span>
              </label>
            </div>
            <p class="setting-description">Expire les sessions inactives après 30 minutes</p>
          </div>

          <div class="setting-item">
            <div class="setting-toggle">
              <label>
                <input type="checkbox" [(ngModel)]="accessSettings.ipRestriction">
                <span>Restriction par adresse IP</span>
              </label>
            </div>
            <p class="setting-description">Limiter l'accès administratif à des adresses IP spécifiques</p>
          </div>
        </div>

        <button 
          class="btn btn-primary"
          (click)="saveAccessSettings()"
          [disabled]="savingSettings">
          <span *ngIf="!savingSettings">💾 Enregistrer les paramètres</span>
          <span *ngIf="savingSettings">Sauvegarde en cours...</span>
        </button>
        <div *ngIf="settingsMessage" [ngClass]="settingsMessageType" class="alert-message">
          {{ settingsMessage }}
        </div>
      </section>

      <!-- Role Change Dialog -->
      <div *ngIf="roleChangeDialog.open" class="modal-overlay" (click)="closeRoleChangeDialog()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h3>Modifier le Rôle</h3>
          <p *ngIf="roleChangeDialog.user" class="modal-subtitle">
            Utilisateur: <strong>{{ roleChangeDialog.user.nom }}</strong>
          </p>
          
          <div class="role-options">
            <label *ngFor="let role of availableRoles" class="role-option">
              <input 
                type="radio" 
                [(ngModel)]="roleChangeDialog.selectedRole"
                [value]="role">
              <span class="option-label">
                <strong>{{ role }}</strong>
                <span class="option-description">{{ getRoleDescription(role) }}</span>
              </span>
            </label>
          </div>

          <div class="modal-actions">
            <button 
              class="btn btn-primary"
              (click)="confirmRoleChange()"
              [disabled]="savingSettings">
              Confirmer
            </button>
            <button 
              class="btn btn-secondary"
              (click)="closeRoleChangeDialog()">
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .roles-section {
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
    .roles-overview {
      display: grid;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .role-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      transition: all 0.2s ease;
    }
    .role-card:hover {
      border-color: var(--primary);
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.1);
    }
    .role-header {
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
    }
    .role-title {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }
    .role-icon {
      font-size: 1.8rem;
    }
    .role-title h3 {
      margin: 0;
      color: var(--text);
    }
    .role-description {
      margin: 0.25rem 0 0 0;
      font-size: 0.9rem;
      color: var(--text-muted);
    }
    .toggle-icon {
      font-size: 0.8rem;
      color: var(--text-muted);
      transition: transform 0.2s;
    }
    .role-card.expanded .toggle-icon {
      transform: rotate(0deg);
    }
    .role-details {
      padding: 1.5rem;
      border-top: 1px solid var(--border);
      background: rgba(249, 115, 22, 0.02);
      animation: slideDown 0.2s ease;
    }
    .permissions-list h4 {
      margin-top: 0;
      margin-bottom: 1rem;
      color: var(--text);
    }
    .permissions-list ul {
      list-style: none;
      padding: 0;
      display: grid;
      gap: 0.75rem;
    }
    .permission-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--text-muted);
    }
    .permission-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: rgba(34, 197, 94, 0.2);
      color: #15803d;
      border-radius: 50%;
      font-size: 0.8rem;
      font-weight: bold;
    }
    .assign-roles-section {
      background: var(--surface);
      padding: 1.5rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      margin-bottom: 2rem;
    }
    .assign-roles-section h3 {
      margin-top: 0;
      margin-bottom: 1.5rem;
    }
    .roles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .role-assignment-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
    }
    .card-header {
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.75rem;
    }
    .card-header h4 {
      margin: 0;
      font-size: 1rem;
    }
    .email {
      display: block;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }
    .card-body {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .card-body label {
      font-weight: 500;
      font-size: 0.9rem;
    }
    .role-display {
      display: flex;
      align-items: center;
      gap: 0.5rem;
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
    .access-control-section {
      background: var(--surface);
      padding: 1.5rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      margin-bottom: 2rem;
    }
    .access-control-section h3 {
      margin-top: 0;
      margin-bottom: 1.5rem;
    }
    .access-settings {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .setting-item {
      padding: 1rem;
      background: rgba(249, 115, 22, 0.02);
      border: 1px solid var(--border);
      border-radius: 6px;
    }
    .setting-toggle label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      font-weight: 500;
      user-select: none;
    }
    .setting-toggle input[type="checkbox"] {
      cursor: pointer;
      width: 18px;
      height: 18px;
    }
    .setting-description {
      margin: 0.5rem 0 0 2rem;
      font-size: 0.9rem;
      color: var(--text-muted);
    }
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-content {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 2rem;
      max-width: 500px;
      width: 90%;
      animation: slideUp 0.3s ease;
    }
    .modal-content h3 {
      margin-top: 0;
      margin-bottom: 0.5rem;
    }
    .modal-subtitle {
      margin-bottom: 1.5rem;
      color: var(--text-muted);
      font-size: 0.95rem;
    }
    .role-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .role-option {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .role-option input[type="radio"] {
      margin-top: 0.25rem;
      cursor: pointer;
    }
    .role-option:hover {
      background: rgba(249, 115, 22, 0.05);
      border-color: var(--primary);
    }
    .option-label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .option-description {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: normal;
    }
    .modal-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }
    .alert-message {
      margin-top: 1rem;
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
    @keyframes slideDown {
      from { opacity: 0; max-height: 0; }
      to { opacity: 1; max-height: 500px; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @media (max-width: 768px) {
      .role-card {
        font-size: 0.9rem;
      }
      .roles-grid {
        grid-template-columns: 1fr;
      }
      .modal-content {
        padding: 1.5rem;
      }
    }
  `]
})
export class RolesAccessComponent implements OnInit {
  users: UserBase[] = [];
  loadingUsers = false;
  savingSettings = false;
  expandedRole: string | null = null;

  roleChangeDialog = {
    open: false,
    user: null as UserBase | null,
    selectedRole: ''
  };

  availableRoles = [
    'Gestionnaire local',
    'Gestionnaire global',
    'Administrateur'
  ];

  roles: RolePermission[] = [
    {
      role: 'Gestionnaire local',
      icon: '👤',
      description: 'Accès limité à un centre d\'examen',
      permissions: [
        'Accéder aux candidatures de son centre',
        'Valider ou rejeter les candidatures',
        'Communiquer avec les candidats',
        'Gérer les places disponibles par spécialité',
        'Assigner les candidats aux salles',
        'Consulter les statistiques de son centre'
      ]
    },
    {
      role: 'Gestionnaire global',
      icon: '🌍',
      description: 'Accès complet avec vue globale',
      permissions: [
        'Accéder à toutes les candidatures',
        'Supervision globale du processus',
        'Configurer les concours et spécialités',
        'Gérer les places par spécialité',
        'Attribuer les spécialités aux centres',
        'Assigner les candidats aux salles',
        'Générer rapports et statistiques',
        'Consulter les données de tous les centres'
      ]
    },
    {
      role: 'Administrateur',
      icon: '🔑',
      description: 'Accès illimité à tous les systèmes',
      permissions: [
        'Toutes les fonctionnalités des gestionnaires globaux',
        'Gérer les comptes utilisateurs',
        'Créer, modifier et supprimer des comptes',
        'Gérer les rôles et les droits d\'accès',
        'Configuration générale de la plateforme',
        'Gestion des centres d\'examen',
        'Gestion des salles d\'examen',
        'Audit des accès et modifications'
      ]
    }
  ];

  accessSettings = {
    requireMfa: false,
    auditLogging: true,
    sessionTimeout: true,
    ipRestriction: false
  };

  settingsMessage = '';
  settingsMessageType = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.api.getUsers().subscribe({
      next: (res) => {
        this.users = res.data || [];
        this.loadingUsers = false;
      },
      error: () => {
        this.loadingUsers = false;
      }
    });
  }

  toggleRoleExpansion(role: string): void {
    this.expandedRole = this.expandedRole === role ? null : role;
  }

  getRoleClass(role: string | null | undefined): string {
    if (!role) return '';
    const label = (role as string).toLowerCase();
    if (label.includes('local')) return 'local';
    if (label.includes('global')) return 'global';
    if (label.includes('administr')) return 'admin';
    return '';
  }

  getRoleDescription(role: string): string {
    const roleObj = this.roles.find(r => r.role === role);
    return roleObj ? roleObj.description : '';
  }

  openRoleChangeDialog(user: UserBase): void {
    this.roleChangeDialog = {
      open: true,
      user: user,
      selectedRole: user.role || ''
    };
  }

  closeRoleChangeDialog(): void {
    this.roleChangeDialog = {
      open: false,
      user: null,
      selectedRole: ''
    };
  }

  confirmRoleChange(): void {
    if (!this.roleChangeDialog.user || !this.roleChangeDialog.selectedRole) return;

    const user = this.roleChangeDialog.user;
    const payload: any = {
      nom: user.nom,
      prenom: (user as any).prenom || '',
      email: user.email,
      role: this.mapRoleToEnum(this.roleChangeDialog.selectedRole),
      centreId: (user as any).centreId
    };

    this.savingSettings = true;
    this.api.updateUser(user.id!, payload).subscribe({
      next: () => {
        this.settingsMessage = `Rôle modifié pour ${user.nom}.`;
        this.settingsMessageType = 'success';
        this.savingSettings = false;
        this.closeRoleChangeDialog();
        this.loadUsers();
      },
      error: () => {
        this.settingsMessage = 'Erreur lors de la modification du rôle.';
        this.settingsMessageType = 'error';
        this.savingSettings = false;
      }
    });
  }

  mapRoleToEnum(roleLabel: string): string {
    if (!roleLabel) return roleLabel;
    const label = roleLabel.toLowerCase();
    if (label.includes('local')) return 'GESTIONNAIRE_LOCAL';
    if (label.includes('global')) return 'GESTIONNAIRE_GLOBAL';
    if (label.includes('administr')) return 'ADMIN';
    return roleLabel;
  }

  saveAccessSettings(): void {
    this.savingSettings = true;
    setTimeout(() => {
      this.settingsMessage = 'Paramètres de contrôle d\'accès enregistrés avec succès.';
      this.settingsMessageType = 'success';
      this.savingSettings = false;
    }, 800);
  }
}
