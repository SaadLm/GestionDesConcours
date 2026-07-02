import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Specialite } from '../../models/models';

@Component({
  selector: 'app-specialty-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="management-shell">
      <div class="hero-card">
        <div>
          <p class="eyebrow">Gestion administrative</p>
          <h2>Gestion des spécialités</h2>
          <p>Ajoutez, modifiez ou supprimez les spécialités proposées aux concours avec une interface claire et rapide.</p>
        </div>
        <div class="hero-pill">{{ specialites.length }} spécialités</div>
      </div>

      
      <div class="panel">
          <div class="panel-header">
            <h3>Liste des spécialités</h3>
            <span class="muted" *ngIf="loading">Chargement...</span>
          </div>

          <div class="empty-state" *ngIf="!loading && specialites.length === 0">
            <p>Aucune spécialité enregistrée pour le moment.</p>
          </div>
          
          <div class="item-list" *ngIf="!loading && specialites.length > 0">
            <article class="item-card" *ngFor="let specialty of specialites">
              <div>
                <h4>{{ specialty.nom }}</h4>
                <p>{{ specialty.description || 'Aucune description fournie.' }}</p>
              </div>
              <div class="item-actions">
                <button class="btn btn-secondary" type="button" (click)="editSpecialty(specialty)">Modifier</button>
                <button class="btn btn-danger" type="button" (click)="deleteSpecialty(specialty.id)">Supprimer</button>
              </div>
            </article>
          </div>
        </div>
        
        <div class="panel">
          <div class="panel-header">
            <h3>{{ editingId ? 'Modifier la spécialité' : 'Ajouter une spécialité' }}</h3>
            <button class="btn btn-secondary" type="button" (click)="cancel()" *ngIf="editingId">Annuler</button>
          </div>
  
          <form (ngSubmit)="submitForm()" class="stacked-form">
            <label class="field">
              <span>Nom de la spécialité</span>
              <input type="text" [(ngModel)]="form.nom" name="nom" placeholder="Ex. Informatique" required>
            </label>
  
            <label class="field">
              <span>Description</span>
              <textarea rows="4" [(ngModel)]="form.description" name="description" placeholder="Décrivez cette spécialité..."></textarea>
            </label>
  
            <div class="form-actions">
              <button class="btn btn-primary" type="submit" [disabled]="saving">
                <span *ngIf="!saving">{{ editingId ? 'Enregistrer les modifications' : 'Créer la spécialité' }}</span>
                <span *ngIf="saving">Enregistrement...</span>
              </button>
            </div>
  
            <div class="alert" *ngIf="message" [class.success]="messageType === 'success'" [class.error]="messageType === 'error'">
              {{ message }}
            </div>
          </form>
        </div>
    </section>
  `,
  styles: [`
    .management-shell {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .hero-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem 1.75rem;
      border: 1px solid var(--border);
      border-radius: 18px;
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(255,255,255,0.95));
    }
    .eyebrow {
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--primary);
      margin-bottom: 0.3rem;
    }
    .hero-pill {
      padding: 0.8rem 1rem;
      border-radius: 999px;
      background: var(--primary);
      color: #fff;
      font-weight: 700;
      white-space: nowrap;
    }
    .grid-layout {
      display: grid;
      grid-template-columns: minmax(320px, 420px) 1fr;
      gap: 1.5rem;
    }
    .panel {
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 1.25rem;
      background: var(--surface);
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .stacked-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .field input,
    .field textarea {
      padding: 0.9rem 1rem;
      border: 1px solid var(--border);
      border-radius: 12px;
      font-size: 1rem;
      background: #fff;
    }
    .field textarea {
      resize: vertical;
      min-height: 110px;
    }
    .form-actions {
      display: flex;
      justify-content: flex-start;
    }
    .item-list {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
    }
    .item-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid var(--border);
      border-radius: 14px;
      background: rgba(248,250,252,0.8);
    }
    .item-card h4 {
      margin-bottom: 0.2rem;
      font-size: 1.05rem;
    }
    .item-card p {
      margin: 0;
      color: var(--text-muted);
    }
    .item-actions {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
    }
    .alert {
      padding: 0.9rem 1rem;
      border-radius: 12px;
      font-weight: 600;
    }
    .alert.success {
      background: rgba(34, 197, 94, 0.12);
      color: #166534;
    }
    .alert.error {
      background: rgba(220, 38, 38, 0.12);
      color: #991b1b;
    }
    .empty-state {
      padding: 1.25rem;
      border: 1px dashed var(--border);
      border-radius: 14px;
      color: var(--text-muted);
      text-align: center;
      background: rgba(248,250,252,0.7);
    }
    .muted {
      color: var(--text-muted);
      font-size: 0.95rem;
    }
    @media (max-width: 900px) {
      .grid-layout {
        grid-template-columns: 1fr;
      }
      .hero-card {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class SpecialtyManagementComponent implements OnInit {
  specialites: Specialite[] = [];
  form: Specialite = { nom: '', description: '' };
  editingId: number | null = null;
  loading = false;
  saving = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadSpecialites();
  }

  loadSpecialites(): void {
    this.loading = true;
    this.api.getAdminSpecialites().subscribe({
      next: (res) => {
        this.specialites = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.message = 'Impossible de charger les spécialités.';
        this.messageType = 'error';
        this.loading = false;
      }
    });
  }

  submitForm(): void {
    if (!this.form.nom?.trim()) {
      this.message = 'Le nom de la spécialité est obligatoire.';
      this.messageType = 'error';
      return;
    }

    this.saving = true;
    const payload: Specialite = { nom: this.form.nom.trim(), description: this.form.description?.trim() };

    if (this.editingId) {
      this.api.updateSpecialite(this.editingId, payload).subscribe({
        next: () => {
          this.message = 'Spécialité mise à jour avec succès.';
          this.messageType = 'success';
          this.cancel();
          this.loadSpecialites();
          this.saving = false;
        },
        error: () => {
          this.message = 'La mise à jour a échoué.';
          this.messageType = 'error';
          this.saving = false;
        }
      });
      return;
    }

    this.api.createSpecialite(payload).subscribe({
      next: () => {
        this.message = 'Spécialité créée avec succès.';
        this.messageType = 'success';
        this.form = { nom: '', description: '' };
        this.loadSpecialites();
        this.saving = false;
      },
      error: () => {
        this.message = 'La création a échoué.';
        this.messageType = 'error';
        this.saving = false;
      }
    });
  }

  editSpecialty(specialty: Specialite): void {
    this.editingId = specialty.id ?? null;
    this.form = { ...specialty };
    this.message = '';
  }

  deleteSpecialty(id?: number): void {
    if (!id) return;
    if (!window.confirm('Supprimer cette spécialité ?')) return;

    this.api.deleteSpecialite(id).subscribe({
      next: () => {
        this.message = 'Spécialité supprimée.';
        this.messageType = 'success';
        this.loadSpecialites();
      },
      error: () => {
        this.message = 'La suppression a échoué.';
        this.messageType = 'error';
      }
    });
  }

  cancel(): void {
    this.editingId = null;
    this.form = { nom: '', description: '' };
    this.message = '';
  }
}
