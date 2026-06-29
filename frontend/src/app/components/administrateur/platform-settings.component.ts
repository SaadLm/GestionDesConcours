import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PlatformSetting {
  key: string;
  label: string;
  description: string;
  type: 'toggle' | 'number' | 'text';
  value: any;
  category: string;
}

@Component({
  selector: 'app-platform-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-section">
      <div class="section-header">
        <h2>Configuration Générale de la Plateforme</h2>
        <p>Gérez les paramètres généraux et les options de configuration du système.</p>
      </div>

      <!-- Settings by Category -->
      <div class="settings-container">
        <div class="settings-category" *ngFor="let category of groupedSettings | keyvalue">
          <div class="category-header">
            <h3>{{ getCategoryTitle(category.key) }}</h3>
            <p class="category-description">{{ getCategoryDescription(category.key) }}</p>
          </div>

          <div class="settings-group">
            <div class="setting-item" *ngFor="let setting of category.value">
              <div class="setting-control">
                <div class="setting-info">
                  <label>{{ setting.label }}</label>
                  <p class="setting-description">{{ setting.description }}</p>
                </div>

                <!-- Toggle Setting -->
                <div *ngIf="setting.type === 'toggle'" class="toggle-wrapper">
                  <label class="toggle-switch">
                    <input 
                      type="checkbox" 
                      [(ngModel)]="setting.value"
                      (change)="markDirty()">
                    <span class="toggle-slider"></span>
                  </label>
                </div>

                <!-- Number Setting -->
                <div *ngIf="setting.type === 'number'" class="input-wrapper">
                  <input 
                    type="number" 
                    [(ngModel)]="setting.value"
                    (change)="markDirty()"
                    class="form-control-small">
                </div>

                <!-- Text Setting -->
                <div *ngIf="setting.type === 'text'" class="input-wrapper">
                  <input 
                    type="text" 
                    [(ngModel)]="setting.value"
                    (change)="markDirty()"
                    class="form-control-small">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Database & Backup Settings -->
      <section class="advanced-settings">
        <h3>Paramètres Avancés</h3>
        
        <div class="setting-item">
          <div class="setting-info">
            <label>Sauvegarde Automatique</label>
            <p class="setting-description">Effectue une sauvegarde quotidienne de la base de données</p>
          </div>
          <button class="btn btn-secondary btn-sm">🔄 Forcer une Sauvegarde Maintenant</button>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label>Maintenance de la Plateforme</label>
            <p class="setting-description">Mettre la plateforme en mode maintenance</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" [(ngModel)]="maintenanceMode" (change)="markDirty()">
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="setting-item" *ngIf="maintenanceMode">
          <label>Message de Maintenance</label>
          <textarea 
            [(ngModel)]="maintenanceMessage"
            (change)="markDirty()"
            class="form-control-textarea"
            placeholder="Entrez le message à afficher aux utilisateurs pendant la maintenance..."
            rows="4"></textarea>
        </div>
      </section>

      <!-- Email Settings -->
      <section class="email-settings">
        <h3>Configuration Email</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label>Adresse Email d'Expédition</label>
            <input 
              type="email" 
              [(ngModel)]="emailSettings.from"
              (change)="markDirty()"
              class="form-control"
              placeholder="noreply@competition.com">
          </div>

          <div class="form-group">
            <label>Serveur SMTP</label>
            <input 
              type="text" 
              [(ngModel)]="emailSettings.smtpServer"
              (change)="markDirty()"
              class="form-control"
              placeholder="smtp.provider.com">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Port SMTP</label>
            <input 
              type="number" 
              [(ngModel)]="emailSettings.smtpPort"
              (change)="markDirty()"
              class="form-control"
              placeholder="587">
          </div>

          <div class="form-group">
            <label>Utilisateur SMTP</label>
            <input 
              type="text" 
              [(ngModel)]="emailSettings.smtpUser"
              (change)="markDirty()"
              class="form-control"
              placeholder="username">
          </div>
        </div>
      </section>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button 
          class="btn btn-primary"
          (click)="saveSettings()"
          [disabled]="!isDirty || savingSettings">
          <span *ngIf="!savingSettings">💾 Enregistrer les Paramètres</span>
          <span *ngIf="savingSettings">Sauvegarde en cours...</span>
        </button>
        <button 
          class="btn btn-secondary"
          (click)="resetSettings()"
          [disabled]="!isDirty">
          ↻ Réinitialiser
        </button>
      </div>

      <!-- Feedback Messages -->
      <div *ngIf="message" [ngClass]="messageType" class="alert-message">
        {{ message }}
      </div>
    </div>
  `,
  styles: [`
    .settings-section {
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
    .settings-container {
      display: grid;
      gap: 2rem;
      margin-bottom: 2rem;
    }
    .settings-category {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }
    .category-header {
      padding: 1.5rem;
      background: rgba(249, 115, 22, 0.03);
      border-bottom: 1px solid var(--border);
    }
    .category-header h3 {
      margin-top: 0;
      margin-bottom: 0.5rem;
    }
    .category-description {
      margin: 0;
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    .settings-group {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: rgba(249, 115, 22, 0.02);
      border: 1px solid var(--border);
      border-radius: 6px;
    }
    .setting-control {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      gap: 2rem;
    }
    .setting-info {
      flex: 1;
    }
    .setting-info label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.35rem;
      color: var(--text);
    }
    .setting-description {
      margin: 0;
      font-size: 0.9rem;
      color: var(--text-muted);
    }
    .toggle-wrapper,
    .input-wrapper {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 26px;
    }
    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: 0.4s;
      border-radius: 26px;
    }
    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.4s;
      border-radius: 50%;
    }
    input:checked + .toggle-slider {
      background-color: var(--primary);
    }
    input:checked + .toggle-slider:before {
      transform: translateX(24px);
    }
    .form-control-small {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: 4px;
      min-width: 150px;
    }
    .advanced-settings,
    .email-settings {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
      margin-bottom: 2rem;
    }
    .advanced-settings h3,
    .email-settings h3 {
      margin-top: 0;
      margin-bottom: 1.5rem;
    }
    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
    }
    .form-group label {
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    .form-control,
    .form-control-textarea {
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 4px;
      font-family: inherit;
      font-size: 1rem;
    }
    .form-control:focus,
    .form-control-textarea:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
    }
    .action-buttons {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .alert-message {
      padding: 1rem;
      border-radius: 4px;
      font-weight: 500;
      margin-top: 1rem;
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
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @media (max-width: 768px) {
      .setting-control {
        flex-direction: column;
        align-items: flex-start;
      }
      .form-row {
        grid-template-columns: 1fr;
      }
      .action-buttons {
        flex-direction: column;
      }
    }
  `]
})
export class PlatformSettingsComponent {
  isDirty = false;
  savingSettings = false;
  message = '';
  messageType = '';

  maintenanceMode = false;
  maintenanceMessage = '';

  emailSettings = {
    from: 'noreply@competition.com',
    smtpServer: 'smtp.provider.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: ''
  };

  settings: PlatformSetting[] = [
    {
      key: 'validation_auto',
      label: 'Validation Automatique des Candidatures',
      description: 'Valider automatiquement les candidatures conformes',
      type: 'toggle',
      value: false,
      category: 'candidatures'
    },
    {
      key: 'notifications_email',
      label: 'Notifications par Email Activées',
      description: 'Envoyer des notifications par email pour les événements importants',
      type: 'toggle',
      value: true,
      category: 'notifications'
    },
    {
      key: 'audit_logging',
      label: 'Enregistrement des Accès (Audit)',
      description: 'Enregistrer tous les accès et modifications administratives',
      type: 'toggle',
      value: true,
      category: 'securite'
    },
    {
      key: 'session_timeout',
      label: 'Délai d\'Expiration de Session',
      description: 'Expirer les sessions inactives (en minutes)',
      type: 'number',
      value: 30,
      category: 'securite'
    },
    {
      key: 'max_upload_size',
      label: 'Taille Maximale des Fichiers Téléchargés',
      description: 'Taille maximale en MB',
      type: 'number',
      value: 25,
      category: 'fichiers'
    },
    {
      key: 'max_candidatures_par_concours',
      label: 'Nombre Maximum de Candidatures par Concours',
      description: 'Limiter le nombre total de candidatures',
      type: 'number',
      value: 5000,
      category: 'candidatures'
    }
  ];

  get groupedSettings() {
    const grouped: { [key: string]: PlatformSetting[] } = {};
    this.settings.forEach(setting => {
      if (!grouped[setting.category]) {
        grouped[setting.category] = [];
      }
      grouped[setting.category].push(setting);
    });
    return grouped;
  }

  getCategoryTitle(category: string): string {
    const titles: { [key: string]: string } = {
      'candidatures': 'Gestion des Candidatures',
      'notifications': 'Notifications',
      'securite': 'Sécurité',
      'fichiers': 'Gestion des Fichiers'
    };
    return titles[category] || category;
  }

  getCategoryDescription(category: string): string {
    const descriptions: { [key: string]: string } = {
      'candidatures': 'Paramètres relatifs au traitement des candidatures',
      'notifications': 'Configuration des notifications du système',
      'securite': 'Paramètres de sécurité et d\'audit',
      'fichiers': 'Limites de taille et gestion des fichiers'
    };
    return descriptions[category] || '';
  }

  markDirty(): void {
    this.isDirty = true;
  }

  saveSettings(): void {
    this.savingSettings = true;
    setTimeout(() => {
      this.message = 'Paramètres de la plateforme enregistrés avec succès.';
      this.messageType = 'success';
      this.isDirty = false;
      this.savingSettings = false;
    }, 800);
  }

  resetSettings(): void {
    // Reset to default values
    this.isDirty = false;
    this.message = 'Paramètres réinitialisés.';
    this.messageType = 'success';
  }
}
