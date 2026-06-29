import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Concours } from '../../models/models';

@Component({
  selector: 'app-competition-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="competitions-section">
      <div class="section-header">
        <h2>Configuration des Concours</h2>
        <p *ngIf="canManage">Créez et gérez les concours disponibles sur la plateforme.</p>
        <p *ngIf="!canManage">Consultation des concours en cours et planifiés.</p>
      </div>

      <!-- Competitions List -->
      <section class="competitions-list-section">
        <h3>Liste des Concours</h3>
        <div *ngIf="loadingConcours" class="loading-state">
          <div class="spinner"></div>
          <p>Chargement des concours...</p>
        </div>
        <div *ngIf="!loadingConcours && concours.length === 0" class="empty-state">
          <p>Aucun concours trouvé. Créez le premier concours ci-dessous.</p>
        </div>
        <div *ngIf="!loadingConcours && concours.length > 0" class="grid">
          <div class="competition-card" *ngFor="let comp of concours" [class.editing]="editingConcours?.id === comp.id">
            <div class="card-header">
              <h4>{{ getConcoursTitle(comp) }}</h4>
              <span class="status-badge" [ngClass]="'status-' + (comp.statut || 'OUVERT')">
                {{ comp.statut || 'OUVERT' }}
              </span>
            </div>
            <div class="card-body">
              <p class="description">{{ comp.description || '—' }}</p>
              <div class="dates">
                <span class="date-item">
                  <strong>Concours:</strong> {{ comp.dateConcours | date: 'dd/MM/yyyy' }}
                </span>
                <span class="date-item">
                  <strong>Inscriptions:</strong> {{ comp.dateDebutInscription | date: 'dd/MM/yyyy' }} — {{ comp.dateFinInscription | date: 'dd/MM/yyyy' }}
                </span>
              </div>
            </div>
            <div class="card-actions" *ngIf="canManage">
              <button class="btn btn-primary btn-sm" (click)="editConcours(comp)">✏️ Éditer</button>
              <button class="btn btn-danger btn-sm" (click)="deleteConcours(comp.id!)">🗑️ Supprimer</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Create/Edit Concours Form -->
      <section class="create-concours-section" *ngIf="canManage">
        <h3>{{ editingConcours ? 'Modifier Concours' : 'Créer un Concours' }}</h3>
        <form (ngSubmit)="saveConcours()" class="concours-form">
          <div class="form-row">
            <div class="form-group">
              <label>Titre du Concours *</label>
              <input 
                type="text" 
                [(ngModel)]="formConcours.titre"
                name="titre"
                placeholder="Ex: Concours d'Entrée 2024"
                class="form-control"
                [class.error]="errors['titre']">
              <span class="error-message" *ngIf="errors['titre']">{{ errors['titre'] }}</span>
            </div>

            <div class="form-group">
              <label>Statut</label>
              <select [(ngModel)]="formConcours.statut" name="statut" class="form-control">
                <option value="OUVERT">Ouvert</option>
                <option value="FERME">Fermé</option>
                <option value="TERMINE">Terminé</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea 
              [(ngModel)]="formConcours.description"
              name="description"
              placeholder="Description du concours..."
              class="form-control-textarea"
              rows="3"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Date du Concours *</label>
              <input 
                type="date" 
                [(ngModel)]="formConcours.dateConcours"
                name="dateConcours"
                class="form-control"
                [class.error]="errors['dateConcours']">
              <span class="error-message" *ngIf="errors['dateConcours']">{{ errors['dateConcours'] }}</span>
            </div>

            <div class="form-group">
              <label>Début Inscriptions *</label>
              <input 
                type="date" 
                [(ngModel)]="formConcours.dateDebutInscription"
                name="dateDebutInscription"
                class="form-control"
                [class.error]="errors['dateDebutInscription']">
              <span class="error-message" *ngIf="errors['dateDebutInscription']">{{ errors['dateDebutInscription'] }}</span>
            </div>

            <div class="form-group">
              <label>Fin Inscriptions *</label>
              <input 
                type="date" 
                [(ngModel)]="formConcours.dateFinInscription"
                name="dateFinInscription"
                class="form-control"
                [class.error]="errors['dateFinInscription']">
              <span class="error-message" *ngIf="errors['dateFinInscription']">{{ errors['dateFinInscription'] }}</span>
            </div>
          </div>

          <div class="form-actions">
            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="savingConcours">
              <span *ngIf="!savingConcours">{{ editingConcours ? '✏️ Mettre à Jour' : '➕ Créer Concours' }}</span>
              <span *ngIf="savingConcours">Sauvegarde en cours...</span>
            </button>
            <button 
              type="button" 
              class="btn btn-secondary"
              (click)="cancelEdit()"
              *ngIf="editingConcours">
              Annuler
            </button>
          </div>

          <div *ngIf="message" [ngClass]="messageType" class="alert-message">
            {{ message }}
          </div>
        </form>
      </section>
    </div>
  `,
  styles: [`
    .competitions-section {
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
    .competitions-list-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    .competitions-list-section h3 {
      margin-top: 0;
      margin-bottom: 1.5rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }
    .competition-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
    }
    .competition-card:hover {
      border-color: var(--primary);
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.1);
    }
    .competition-card.editing {
      border-color: var(--primary);
      background: rgba(249, 115, 22, 0.03);
    }
    .card-header {
      padding: 1rem;
      background: rgba(249, 115, 22, 0.05);
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-header h4 {
      margin: 0;
      flex: 1;
    }
    .status-badge {
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
      white-space: nowrap;
    }
    .status-badge.status-Planifié {
      background: rgba(59, 130, 246, 0.15);
      color: #1e40af;
    }
    .status-badge.status-pending {
      background: rgba(59, 130, 246, 0.15);
      color: #1e40af;
    }
    .status-badge.status-En\ cours {
      background: rgba(249, 115, 22, 0.15);
      color: #9a3412;
    }
    .status-badge.status-Terminé {
      background: rgba(34, 197, 94, 0.15);
      color: #15803d;
    }
    .card-body {
      padding: 1rem;
      flex: 1;
    }
    .description {
      margin: 0 0 1rem 0;
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    .dates {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: rgba(249, 115, 22, 0.03);
      border-radius: 4px;
    }
    .date-item {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .date-item strong {
      color: var(--text);
    }
    .specialties {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }
    .specialties strong {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.85rem;
    }
    .specialty-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .tag {
      display: inline-block;
      padding: 0.35rem 0.75rem;
      background: rgba(168, 85, 247, 0.15);
      color: #6b21a8;
      border-radius: 12px;
      font-size: 0.8rem;
    }
    .card-actions {
      padding: 1rem;
      border-top: 1px solid var(--border);
      display: flex;
      gap: 0.5rem;
    }
    .create-concours-section {
      padding: 1.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    .create-concours-section h3 {
      margin-top: 0;
      margin-bottom: 1.5rem;
    }
    .concours-form {
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
    .empty-state {
      padding: 2rem;
      text-align: center;
      color: var(--text-muted);
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @media (max-width: 768px) {
      .grid {
        grid-template-columns: 1fr;
      }
      .form-row {
        grid-template-columns: 1fr;
      }
      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class CompetitionManagementComponent implements OnInit {
  concours: Concours[] = [];
  editingConcours: Concours | null = null;
  formConcours: Concours = this.emptyForm();
  canManage = false;

  loadingConcours = false;
  savingConcours = false;
  errors: { [key: string]: string } = {};
  message = '';
  messageType = '';

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.canManage = this.auth.canManagePlatform();
    this.loadConcours();
  }

  getConcoursTitle(comp: Concours): string {
    return comp.titre || comp.nom || 'Concours';
  }

  private emptyForm(): Concours {
    return {
      titre: '',
      description: '',
      dateConcours: '',
      dateDebutInscription: '',
      dateFinInscription: '',
      statut: 'OUVERT'
    };
  }

  loadConcours(): void {
    this.loadingConcours = true;
    this.api.getAdminConcours().subscribe({
      next: (res) => {
        this.concours = res.data || [];
        this.loadingConcours = false;
      },
      error: () => {
        this.message = 'Erreur lors du chargement des concours.';
        this.messageType = 'error';
        this.loadingConcours = false;
      }
    });
  }

  editConcours(comp: Concours): void {
    this.editingConcours = comp;
    this.formConcours = { ...comp };
  }

  cancelEdit(): void {
    this.editingConcours = null;
    this.formConcours = this.emptyForm();
    this.errors = {};
  }

  validateForm(): boolean {
    this.errors = {};

    if (!this.formConcours.titre?.trim() || (this.formConcours.titre?.trim().length ?? 0) < 3) {
      this.errors['titre'] = 'Le titre doit contenir au moins 3 caractères.';
    }
    if (!this.formConcours.dateConcours) {
      this.errors['dateConcours'] = 'La date du concours est requise.';
    }
    if (!this.formConcours.dateDebutInscription) {
      this.errors['dateDebutInscription'] = 'La date de début est requise.';
    }
    if (!this.formConcours.dateFinInscription) {
      this.errors['dateFinInscription'] = 'La date de fin est requise.';
    }
    if (this.formConcours.dateDebutInscription && this.formConcours.dateFinInscription &&
        new Date(this.formConcours.dateDebutInscription) >= new Date(this.formConcours.dateFinInscription)) {
      this.errors['dateFinInscription'] = 'La fin des inscriptions doit être après le début.';
    }

    return Object.keys(this.errors).length === 0;
  }

  saveConcours(): void {
    if (!this.canManage || !this.validateForm()) {
      this.message = 'Veuillez corriger les erreurs du formulaire.';
      this.messageType = 'error';
      return;
    }

    this.savingConcours = true;
    const request = this.editingConcours?.id
      ? this.api.updateConcours(this.editingConcours.id, this.formConcours)
      : this.api.createConcours(this.formConcours);

    request.subscribe({
      next: () => {
        this.message = this.editingConcours
          ? `Concours "${this.formConcours.titre}" mis à jour.`
          : `Concours "${this.formConcours.titre}" créé.`;
        this.messageType = 'success';
        this.savingConcours = false;
        this.cancelEdit();
        this.loadConcours();
      },
      error: () => {
        this.message = 'Erreur lors de la sauvegarde du concours.';
        this.messageType = 'error';
        this.savingConcours = false;
      }
    });
  }

  deleteConcours(id: number): void {
    if (!this.canManage) return;
    const comp = this.concours.find(c => c.id === id);
    if (!comp) return;

    const confirmed = window.confirm(`Êtes-vous sûr de vouloir supprimer "${this.getConcoursTitle(comp)}"?`);
    if (!confirmed) return;

    this.api.deleteConcours(id).subscribe({
      next: () => {
        this.message = `Concours "${this.getConcoursTitle(comp)}" supprimé.`;
        this.messageType = 'success';
        this.loadConcours();
      },
      error: () => {
        this.message = 'Erreur lors de la suppression du concours.';
        this.messageType = 'error';
      }
    });
  }
}
