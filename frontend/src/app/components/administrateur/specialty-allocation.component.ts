import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Centre, CentreSpecialiteAllocation, Specialite } from '../../models/models';

interface AllocationRow extends CentreSpecialiteAllocation {
  centreName: string;
  specialiteName: string;
}

@Component({
  selector: 'app-specialty-allocation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="allocation-section">
      <div class="section-header">
        <h2>Attribution des Spécialités aux Centres</h2>
        <p *ngIf="canManage">Gérez l'allocation des spécialités aux différents centres d'examen.</p>
        <p *ngIf="!canManage">Consultez les allocations de spécialités par centre d'examen.</p>
      </div>

      <!-- Filter Bar -->
      <section class="filter-bar">
        <div class="filter-group">
          <label>Filtrer par Centre</label>
          <select [(ngModel)]="selectedCentreFilter" (change)="onFilterChange()">
            <option [value]="null">-- Tous les centres --</option>
            <option *ngFor="let centre of centres" [ngValue]="centre.id">
              {{ centre.nom }} - {{ centre.ville }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>Filtrer par Spécialité</label>
          <input 
            type="text" 
            [(ngModel)]="specialtyFilter"
            (change)="onFilterChange()"
            placeholder="Rechercher une spécialité...">
        </div>
      </section>

      <!-- Allocations Table -->
      <section class="allocations-section">
        <h3>Allocations Actuelles</h3>
        <div *ngIf="loadingAllocations" class="loading-state">
          <div class="spinner"></div>
          <p>Chargement des allocations...</p>
        </div>
        <div *ngIf="!loadingAllocations && filteredAllocations.length === 0" class="empty-state">
          <p>Aucune allocation trouvée. Créez la première allocation ci-dessous.</p>
        </div>
        <table *ngIf="!loadingAllocations && filteredAllocations.length > 0" class="allocations-table">
          <thead>
            <tr>
              <th>Spécialité</th>
              <th>Centre</th>
              <th>Places</th>
              <th *ngIf="canManage">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let alloc of filteredAllocations">
              <td class="specialty-name">{{ alloc.specialiteName }}</td>
              <td>{{ alloc.centreName }}</td>
              <td class="number">{{ alloc.nombrePlaces }}</td>
              <td class="actions" *ngIf="canManage">
                <button class="btn btn-primary btn-xs" (click)="editAllocation(alloc)">✏️</button>
                <button class="btn btn-danger btn-xs" (click)="deleteAllocation(alloc.id!)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Create/Edit Allocation Form -->
      <section class="create-allocation-section" *ngIf="canManage">
        <h3>{{ editingAllocation ? 'Modifier Allocation' : 'Créer une Allocation' }}</h3>
        <form (ngSubmit)="saveAllocation()" class="allocation-form">
          <div class="form-row">
            <div class="form-group">
              <label>Spécialité *</label>
              <select
                [(ngModel)]="formAllocation.specialiteId"
                name="specialiteId"
                class="form-control"
                [class.error]="errors['specialiteId']">
                <option [ngValue]="null">-- Sélectionner --</option>
                <option *ngFor="let s of specialites" [ngValue]="s.id">{{ s.nom }}</option>
              </select>
              <span class="error-message" *ngIf="errors['specialiteId']">{{ errors['specialiteId'] }}</span>
            </div>

            <div class="form-group">
              <label>Centre *</label>
              <select 
                [(ngModel)]="formAllocation.centreId"
                name="centreId"
                class="form-control"
                [class.error]="errors['centreId']">
                <option [ngValue]="null">-- Sélectionner un centre --</option>
                <option *ngFor="let centre of centres" [ngValue]="centre.id">
                  {{ centre.nom }} - {{ centre.ville }}
                </option>
              </select>
              <span class="error-message" *ngIf="errors['centreId']">{{ errors['centreId'] }}</span>
            </div>

            <div class="form-group">
              <label>Nombre de Places *</label>
              <input 
                type="number" 
                [(ngModel)]="formAllocation.nombrePlaces"
                name="nombrePlaces"
                min="1"
                class="form-control"
                [class.error]="errors['nombrePlaces']">
              <span class="error-message" *ngIf="errors['nombrePlaces']">{{ errors['nombrePlaces'] }}</span>
            </div>
          </div>

          <div class="form-actions">
            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="savingAllocation">
              <span *ngIf="!savingAllocation">{{ editingAllocation ? '✏️ Mettre à Jour' : '➕ Créer Allocation' }}</span>
              <span *ngIf="savingAllocation">Sauvegarde en cours...</span>
            </button>
            <button 
              type="button" 
              class="btn btn-secondary"
              (click)="cancelEdit()"
              *ngIf="editingAllocation">
              Annuler
            </button>
          </div>

          <div *ngIf="message" [ngClass]="messageType" class="alert-message">
            {{ message }}
          </div>
        </form>
      </section>

      <!-- Capacity Overview -->
      <section class="capacity-overview">
        <h3>Vue d'Ensemble de la Capacité par Centre</h3>
        <div class="capacity-grid">
          <div class="capacity-card" *ngFor="let centre of centres">
            <h4>{{ centre.nom }}</h4>
            <p class="location">{{ centre.ville }}</p>
            <div class="capacity-stats">
              <div class="stat">
                <span class="label">Spécialités</span>
                <span class="value">{{ getSpecialtiesCount(centre.id!) }}</span>
              </div>
              <div class="stat">
                <span class="label">Places Totales</span>
                <span class="value">{{ getTotalSpots(centre.id!) }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .allocation-section {
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
    .filter-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
      padding: 1rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    .filter-group {
      display: flex;
      flex-direction: column;
    }
    .filter-group label {
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    .filter-group input,
    .filter-group select {
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 4px;
    }
    .allocations-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    .allocations-section h3 {
      margin-top: 0;
      margin-bottom: 1.5rem;
    }
    .allocations-table {
      width: 100%;
      border-collapse: collapse;
    }
    .allocations-table th {
      background: #f8fafc;
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: var(--secondary);
      border-bottom: 2px solid var(--border);
    }
    .allocations-table td {
      padding: 1rem;
      border-bottom: 1px solid var(--border);
    }
    .allocations-table tbody tr:hover {
      background: rgba(249, 115, 22, 0.03);
    }
    .allocations-table tbody tr.full {
      background: rgba(220, 38, 38, 0.05);
    }
    .specialty-name {
      font-weight: 500;
      color: var(--primary);
    }
    .number {
      text-align: center;
      font-weight: 500;
    }
    .progress-bar {
      position: relative;
      height: 24px;
      background: rgba(249, 115, 22, 0.1);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .progress-fill {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      // background: linear-gradient(90deg, var(--primary), #f97316); 
      background: linear-gradient(90deg, var(--primary), #1680f9);
      transition: width 0.3s ease;
      border-radius: 12px;
    }
    .progress-fill.full {
      background: linear-gradient(90deg, #dc2626, #991b1b);
    }
    .progress-text {
      position: relative;
      z-index: 1;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text);
    }
    .actions {
      display: flex;
      gap: 0.5rem;
    }
    .btn-xs {
      padding: 0.35rem 0.6rem;
      font-size: 0.75rem;
    }
    .create-allocation-section {
      padding: 1.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      margin-bottom: 2rem;
    }
    .create-allocation-section h3 {
      margin-top: 0;
      margin-bottom: 1.5rem;
    }
    .allocation-form {
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
    .form-control {
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 4px;
      font-size: 1rem;
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
    .capacity-overview {
      padding: 1.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    .capacity-overview h3 {
      margin-top: 0;
      margin-bottom: 1.5rem;
    }
    .capacity-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }
    .capacity-card {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.05), rgba(168, 85, 247, 0.05));
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.5rem;
    }
    .capacity-card h4 {
      margin-top: 0;
      margin-bottom: 0.25rem;
    }
    .location {
      margin: 0 0 1rem 0;
      font-size: 0.9rem;
      color: var(--text-muted);
    }
    .capacity-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .stat .label {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
    }
    .stat .value {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--primary);
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
      .form-row {
        grid-template-columns: 1fr;
      }
      .form-actions {
        flex-direction: column;
      }
      .capacity-stats {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SpecialtyAllocationComponent implements OnInit {
  allocations: AllocationRow[] = [];
  centres: Centre[] = [];
  specialites: Specialite[] = [];
  canManage = false;
  
  editingAllocation: AllocationRow | null = null;
  formAllocation: { centreId: number | null; specialiteId: number | null; nombrePlaces: number } = {
    centreId: null,
    specialiteId: null,
    nombrePlaces: 50
  };

  selectedCentreFilter: number | null = null;
  specialtyFilter = '';
  loadingAllocations = false;
  savingAllocation = false;
  errors: { [key: string]: string } = {};
  message = '';
  messageType = '';

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.canManage = this.auth.canManagePlatform();
    this.loadCentres();
    this.loadSpecialites();
  }

  loadCentres(): void {
    this.api.getAdminCentres().subscribe({
      next: (res) => {
        this.centres = res.data || [];
        this.loadAllocations();
      },
      error: () => {
        this.message = 'Erreur lors du chargement des centres.';
        this.messageType = 'error';
      }
    });
  }

  loadSpecialites(): void {
    this.api.getAdminSpecialites().subscribe({
      next: (res) => {
        this.specialites = res.data || [];
      },
      error: () => {
        // non-blocking
      }
    });
  }

  loadAllocations(): void {
    if (!this.centres.length) {
      this.allocations = [];
      return;
    }

    this.loadingAllocations = true;
    const requests = this.centres
      .filter(c => c.id != null)
      .map(c => this.api.getCentreSpecialitesByCentre(c.id!));

    forkJoin(requests).subscribe({
      next: (responses) => {
        this.allocations = responses.flatMap((res, index) => {
          const centre = this.centres[index];
          return (res.data || []).map(item => ({
            ...item,
            centreId: centre.id,
            centreName: centre.nom,
            specialiteName: item.specialite?.nom || '—'
          }));
        });
        this.loadingAllocations = false;
      },
      error: () => {
        this.message = 'Erreur lors du chargement des allocations.';
        this.messageType = 'error';
        this.loadingAllocations = false;
      }
    });
  }

  get filteredAllocations(): AllocationRow[] {
    return this.allocations.filter(alloc => {
      const matchesCentre = !this.selectedCentreFilter || alloc.centreId === this.selectedCentreFilter;
      const matchesSpecialty = !this.specialtyFilter ||
        alloc.specialiteName.toLowerCase().includes(this.specialtyFilter.toLowerCase());
      return matchesCentre && matchesSpecialty;
    });
  }

  onFilterChange(): void {}

  editAllocation(alloc: AllocationRow): void {
    this.editingAllocation = alloc;
    this.formAllocation = {
      centreId: alloc.centreId ?? null,
      specialiteId: alloc.specialite?.id ?? alloc.specialiteId ?? null,
      nombrePlaces: alloc.nombrePlaces
    };
  }

  cancelEdit(): void {
    this.editingAllocation = null;
    this.formAllocation = { centreId: null, specialiteId: null, nombrePlaces: 50 };
    this.errors = {};
  }

  validateForm(): boolean {
    this.errors = {};

    if (!this.formAllocation.specialiteId) {
      this.errors['specialiteId'] = 'Veuillez sélectionner une spécialité.';
    }
    if (!this.formAllocation.centreId) {
      this.errors['centreId'] = 'Veuillez sélectionner un centre.';
    }
    if (!this.formAllocation.nombrePlaces || this.formAllocation.nombrePlaces < 1) {
      this.errors['nombrePlaces'] = 'Le nombre de places doit être au minimum 1.';
    }

    return Object.keys(this.errors).length === 0;
  }

  saveAllocation(): void {
    if (!this.canManage || !this.validateForm()) {
      this.message = 'Veuillez corriger les erreurs du formulaire.';
      this.messageType = 'error';
      return;
    }

    this.savingAllocation = true;

    if (this.editingAllocation?.id) {
      this.api.updateCentreSpecialite(this.editingAllocation.id, this.formAllocation.nombrePlaces).subscribe({
        next: () => this.onSaveSuccess('Allocation mise à jour.'),
        error: () => this.onSaveError()
      });
      return;
    }

    this.api.createCentreSpecialite({
      centreId: this.formAllocation.centreId!,
      specialiteId: this.formAllocation.specialiteId!,
      nombrePlaces: this.formAllocation.nombrePlaces
    }).subscribe({
      next: () => this.onSaveSuccess('Allocation créée.'),
      error: () => this.onSaveError()
    });
  }

  private onSaveSuccess(msg: string): void {
    this.message = msg;
    this.messageType = 'success';
    this.savingAllocation = false;
    this.cancelEdit();
    this.loadAllocations();
  }

  private onSaveError(): void {
    this.message = 'Erreur lors de la sauvegarde de l\'allocation.';
    this.messageType = 'error';
    this.savingAllocation = false;
  }

  deleteAllocation(id: number): void {
    if (!this.canManage) return;
    const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer cette allocation?');
    if (!confirmed) return;

    this.api.deleteCentreSpecialite(id).subscribe({
      next: () => {
        this.message = 'Allocation supprimée.';
        this.messageType = 'success';
        this.loadAllocations();
      },
      error: () => {
        this.message = 'Erreur lors de la suppression.';
        this.messageType = 'error';
      }
    });
  }

  getSpecialtiesCount(centreId: number): number {
    return [...new Set(this.allocations
      .filter(a => a.centreId === centreId)
      .map(a => a.specialiteName))].length;
  }

  getTotalSpots(centreId: number): number {
    return this.allocations
      .filter(a => a.centreId === centreId)
      .reduce((sum, a) => sum + (a.nombrePlaces || 0), 0);
  }
}
