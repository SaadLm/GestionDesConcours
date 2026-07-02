import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Centre, CentreSpecialiteAllocation, Specialite } from '../../models/models';

@Component({
  selector: 'app-centres-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="management-shell">
      <div class="hero-card">
        <div>
          <p class="eyebrow">Gestion des centres</p>
          <h2>Gestion des centres d’examen</h2>
          <p>Créez, modifiez et supprimez les centres. Chaque centre peut ensuite accueillir des candidats et des salles.</p>
        </div>
        <div class="hero-pill">{{ centres.length }} centres</div>
      </div>

      <div class="grid-layout">
        <div class="panel">
          <div class="panel-header">
            <h3>{{ editingId ? 'Modifier le centre' : 'Ajouter un centre' }}</h3>
            <button class="btn btn-secondary" type="button" (click)="cancel()" *ngIf="editingId">Annuler</button>
          </div>

          <form (ngSubmit)="submitForm()" class="stacked-form">
            <label class="field">
              <span>Nom du centre</span>
              <input type="text" [(ngModel)]="form.nom" name="nom" placeholder="Ex. Centre de Rabat" required>
            </label>

            <label class="field">
              <span>Ville</span>
              <input type="text" [(ngModel)]="form.ville" name="ville" placeholder="Ex. Rabat" required>
            </label>

            <label class="field">
              <span>Adresse</span>
              <input type="text" [(ngModel)]="form.adresse" name="adresse" placeholder="Adresse complète">
            </label>

            <label class="field">
              <span>Téléphone</span>
              <input type="text" [(ngModel)]="form.telephone" name="telephone" placeholder="Téléphone">
            </label>

            <div class="form-actions">
              <button class="btn btn-primary" type="submit" [disabled]="saving">
                <span *ngIf="!saving">{{ editingId ? 'Enregistrer les modifications' : 'Créer le centre' }}</span>
                <span *ngIf="saving">Enregistrement...</span>
              </button>
            </div>

            <div class="alert" *ngIf="message" [class.success]="messageType === 'success'" [class.error]="messageType === 'error'">
              {{ message }}
            </div>
          </form>
        </div>

        <div class="panel">
          <div class="panel-header">
            <h3>Liste des centres</h3>
            <span class="muted" *ngIf="loading">Chargement...</span>
          </div>

          <div class="empty-state" *ngIf="!loading && centres.length === 0">
            <p>Aucun centre enregistré pour le moment.</p>
          </div>

          <div class="item-list" *ngIf="!loading && centres.length > 0">
            <ng-container *ngFor="let centre of centres">
              <article class="item-card">
                <div>
                  <h4>{{ centre.nom }}</h4>
                  <p>{{ centre.ville }}</p>
                  <p class="small-text">{{ centre.adresse || 'Adresse non précisée' }} · {{ centre.telephone || 'Téléphone non précisé' }}</p>
                </div>
                <div class="item-actions">
                  <button class="btn btn-secondary" type="button" (click)="editCentre(centre)">Modifier</button>
                  <button class="btn btn-primary" type="button" (click)="toggleCentreSpecialites(centre)">
                    {{ expandedCentreId === centre.id ? '🔽 Masquer spécialités' : '📄 Afficher spécialités' }}
                  </button>
                  <button class="btn btn-danger" type="button" (click)="deleteCentre(centre.id)">Supprimer</button>
                </div>
              </article>
            </ng-container>
          </div>
        </div>
      </div>
      <div class="overlay-backdrop" *ngIf="expandedCentreId" (click)="closeSpecialites()"></div>
      <section class="specialities-overlay" *ngIf="expandedCentreId && selectedCentre" (click)="$event.stopPropagation()">
        <div class="overlay-header">
          <div>
            <h3>Spécialités du centre «{{ selectedCentre.nom }}»</h3>
            <p class="muted">Éditez la spécialité ou le nombre de places allouées au centre.</p>
          </div>
          <button class="close-btn" type="button" (click)="closeSpecialites()">✕</button>
        </div>
        <div *ngIf="loadingSpecialites" class="loading-state">
          <div class="spinner"></div>
          <p>Chargement des spécialités...</p>
        </div>
        <div *ngIf="!loadingSpecialites && (!centreSpecialites[selectedCentre.id!] || centreSpecialites[selectedCentre.id!].length === 0)" class="empty-state">
          <p>Aucune spécialité assignée à ce centre.</p>
        </div>
        <div *ngIf="!loadingSpecialites && (centreSpecialites[selectedCentre.id!]?.length ?? 0) > 0" class="specialities-list">
          <article class="speciality-card" *ngFor="let allocation of centreSpecialites[selectedCentre.id!]">
            <div class="speciality-header">
              <h5>{{ allocation.specialite?.nom }}</h5>
              <span class="badge">Places: {{ allocation.nombrePlaces }}</span>
            </div>
            <p class="small-text">{{ allocation.specialite?.description || 'Aucune description fournie.' }}</p>
            <div class="speciality-actions">
              <button class="btn btn-secondary btn-sm" type="button" (click)="startEditSpecialite(allocation)">Modifier spécialité</button>
              <button class="btn btn-secondary btn-sm" type="button" (click)="togglePlacesEdit(allocation)">Modifier places</button>
            </div>

            <form *ngIf="editingAllocation?.id === allocation.id" (ngSubmit)="saveSpecialiteEdit()" class="edit-speciality-form">
              <label class="field"><span>Nom de la spécialité</span>
                <input type="text" [(ngModel)]="allocationEditForm.nom" name="nom-{{allocation.id}}" required>
              </label>
              <label class="field"><span>Description</span>
                <textarea rows="3" [(ngModel)]="allocationEditForm.description" name="description-{{allocation.id}}"></textarea>
              </label>
              <div class="form-actions">
                <button class="btn btn-primary btn-sm" type="submit">Enregistrer</button>
                <button class="btn btn-secondary btn-sm" type="button" (click)="cancelSpecialiteEdit()">Annuler</button>
              </div>
            </form>

            <div *ngIf="placesEditAllocation?.id === allocation.id" class="edit-places-form">
              <label class="field"><span>Places attribuées</span>
                <input type="number" min="1" [(ngModel)]="placesEditForm.nombrePlaces" name="places-{{allocation.id}}">
              </label>
              <div class="form-actions">
                <button class="btn btn-primary btn-sm" type="button" (click)="savePlacesEdit(allocation)">Enregistrer</button>
                <button class="btn btn-secondary btn-sm" type="button" (click)="cancelPlacesEdit()">Annuler</button>
              </div>
            </div>
          </article>
        </div>
      </section>
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
    .field input {
      padding: 0.9rem 1rem;
      border: 1px solid var(--border);
      border-radius: 12px;
      font-size: 1rem;
      background: #fff;
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
    .overlay-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      z-index: 20;
    }
    .specialities-overlay {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(95vw, 900px);
      max-height: 85vh;
      overflow: auto;
      padding: 1.5rem;
      border-radius: 18px;
      background: var(--surface);
      box-shadow: 0 24px 80px rgba(15, 23, 42, 0.25);
      z-index: 30;
    }
    .specialities-overlay .overlay-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .specialities-overlay .close-btn {
      border: none;
      background: transparent;
      color: var(--text);
      font-size: 1.4rem;
      cursor: pointer;
      line-height: 1;
    }
    .specialities-overlay .specialities-list {
      display: grid;
      gap: 1rem;
    }
    .speciality-card {
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 1rem;
      background: rgba(248,250,252,0.96);
      display: grid;
      gap: 1rem;
    }
    .speciality-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
    .speciality-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .specialities-overlay .loading-state,
    .specialities-overlay .empty-state {
      padding: 1.5rem;
      text-align: center;
    }
    .item-card h4 {
      margin-bottom: 0.2rem;
      font-size: 1.05rem;
    }
    .item-card p {
      margin: 0;
      color: var(--text-muted);
    }
    .small-text {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
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
export class CentresManagementComponent implements OnInit {
  centres: Centre[] = [];
  centreSpecialites: Record<number, CentreSpecialiteAllocation[]> = {};
  expandedCentreId?: number;
  selectedCentre?: Centre;
  editingAllocation?: CentreSpecialiteAllocation;
  allocationEditForm: Specialite = { nom: '', description: '' };
  placesEditAllocation?: CentreSpecialiteAllocation;
  placesEditForm: { nombrePlaces: number } = { nombrePlaces: 0 };
  form: Centre = { nom: '', ville: '', adresse: '', telephone: '' };
  editingId: number | null = null;
  loading = false;
  loadingSpecialites = false;
  saving = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadCentres();
  }

  loadCentres(): void {
    this.loading = true;
    this.api.getAdminCentres().subscribe({
      next: (res) => {
        this.centres = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.message = 'Impossible de charger les centres.';
        this.messageType = 'error';
        this.loading = false;
      }
    });
  }

  toggleCentreSpecialites(centre: Centre): void {
    if (this.expandedCentreId === centre.id) {
      this.closeSpecialites();
      return;
    }
    this.expandedCentreId = centre.id;
    this.selectedCentre = centre;
    this.loadCentreSpecialites(centre.id!);
  }

  closeSpecialites(): void {
    this.expandedCentreId = undefined;
    this.selectedCentre = undefined;
    this.editingAllocation = undefined;
    this.placesEditAllocation = undefined;
  }

  loadCentreSpecialites(centreId: number): void {
    this.loadingSpecialites = true;
    this.api.getCentreSpecialitesByCentre(centreId).subscribe({
      next: (res) => {
        this.centreSpecialites[centreId] = res.data || [];
        this.loadingSpecialites = false;
      },
      error: () => {
        this.centreSpecialites[centreId] = [];
        this.loadingSpecialites = false;
      }
    });
  }

  startEditSpecialite(allocation: CentreSpecialiteAllocation): void {
    this.editingAllocation = { ...allocation };
    this.allocationEditForm = {
      nom: allocation.specialite?.nom || '',
      description: allocation.specialite?.description || ''
    };
    this.placesEditAllocation = undefined;
  }

  saveSpecialiteEdit(): void {
    if (!this.editingAllocation || !this.editingAllocation.specialite?.id) {
      return;
    }
    const specialiteId = this.editingAllocation.specialite.id;
    const payload: Specialite = {
      nom: this.allocationEditForm.nom,
      description: this.allocationEditForm.description
    };
    this.api.updateSpecialite(specialiteId, payload).subscribe({
      next: () => {
        if (this.editingAllocation?.centreId) {
          this.loadCentreSpecialites(this.editingAllocation.centreId);
        }
        this.editingAllocation = undefined;
      },
      error: () => {
        this.message = 'Impossible de mettre à jour la spécialité.';
        this.messageType = 'error';
      }
    });
  }

  cancelSpecialiteEdit(): void {
    this.editingAllocation = undefined;
  }

  togglePlacesEdit(allocation: CentreSpecialiteAllocation): void {
    if (this.placesEditAllocation?.id === allocation.id) {
      this.placesEditAllocation = undefined;
      return;
    }
    this.placesEditAllocation = allocation;
    this.placesEditForm = { nombrePlaces: allocation.nombrePlaces };
    this.editingAllocation = undefined;
  }

  savePlacesEdit(allocation: CentreSpecialiteAllocation): void {
    if (!allocation.id) return;
    this.api.updateCentreSpecialite(allocation.id, this.placesEditForm.nombrePlaces).subscribe({
      next: () => {
        if (allocation.centreId) {
          this.loadCentreSpecialites(allocation.centreId);
        }
        this.placesEditAllocation = undefined;
      },
      error: () => {
        this.message = 'Impossible de mettre à jour les places.';
        this.messageType = 'error';
      }
    });
  }

  cancelPlacesEdit(): void {
    this.placesEditAllocation = undefined;
  }

  submitForm(): void {
    if (!this.form.nom?.trim() || !this.form.ville?.trim()) {
      this.message = 'Le nom et la ville du centre sont obligatoires.';
      this.messageType = 'error';
      return;
    }

    this.saving = true;
    const payload: Centre = {
      nom: this.form.nom.trim(),
      ville: this.form.ville.trim(),
      adresse: this.form.adresse?.trim(),
      telephone: this.form.telephone?.trim()
    };

    if (this.editingId) {
      this.api.updateCentre(this.editingId, payload).subscribe({
        next: () => {
          this.message = 'Centre mis à jour avec succès.';
          this.messageType = 'success';
          this.cancel();
          this.loadCentres();
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

    this.api.createCentre(payload).subscribe({
      next: () => {
        this.message = 'Centre créé avec succès.';
        this.messageType = 'success';
        this.form = { nom: '', ville: '', adresse: '', telephone: '' };
        this.loadCentres();
        this.saving = false;
      },
      error: () => {
        this.message = 'La création a échoué.';
        this.messageType = 'error';
        this.saving = false;
      }
    });
  }

  editCentre(centre: Centre): void {
    this.editingId = centre.id ?? null;
    this.form = { ...centre };
    this.message = '';
  }

  deleteCentre(id?: number): void {
    if (!id) return;
    if (!window.confirm('Supprimer ce centre ?')) return;

    this.api.deleteCentre(id).subscribe({
      next: () => {
        this.message = 'Centre supprimé.';
        this.messageType = 'success';
        this.loadCentres();
      },
      error: () => {
        this.message = 'La suppression a échoué.';
        this.messageType = 'error';
      }
    });
  }

  cancel(): void {
    this.editingId = null;
    this.form = { nom: '', ville: '', adresse: '', telephone: '' };
    this.message = '';
  }
}
