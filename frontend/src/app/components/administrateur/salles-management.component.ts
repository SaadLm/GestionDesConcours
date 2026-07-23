import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Centre, Salle, Specialite } from '../../models/models';

@Component({
  selector: 'app-salles-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="rooms-shell">
      <header class="page-header">
        <div>
          <p class="eyebrow">Organisation des épreuves</p>
          <h2>Salles d'examen</h2>
          <p>Créez et rattachez chaque salle à un centre et à une spécialité pour garantir des affectations cohérentes.</p>
        </div>
        <button class="btn btn-primary" type="button" (click)="startCreate()">+ Nouvelle salle</button>
      </header>

      <div class="filters panel">
        <label>Centre
          <select [(ngModel)]="filterCentreId" (change)="onFilterCentreChange()" [disabled]="isLocal">
            <option [ngValue]="undefined">Tous les centres</option>
            <option *ngFor="let centre of centres" [ngValue]="centre.id">{{ centre.nom }} · {{ centre.ville }}</option>
          </select>
        </label>
        <label>Spécialité
          <select [(ngModel)]="filterSpecialiteId" (change)="onFilterSpecialiteChange()">
            <option [ngValue]="undefined">Toutes les spécialités</option>
            <option *ngFor="let specialite of filterSpecialites" [ngValue]="specialite.id">{{ specialite.nom }}</option>
          </select>
        </label>
      </div>

      <div class="panel" *ngIf="showForm">
        <div class="form-header"><h3>{{ editingSalle ? 'Modifier la salle' : 'Créer une salle' }}</h3><button class="close" type="button" (click)="cancelForm()">×</button></div>
        <div class="form-grid">
          <label>Nom de la salle *<input [(ngModel)]="form.nom" placeholder="Ex. Salle A-12"></label>
          <label>Capacité *<input type="number" min="1" [(ngModel)]="form.capacite"></label>
          <label>Centre *
            <select [(ngModel)]="form.centreId" (change)="onFormCentreChange()" [disabled]="isLocal">
              <option [ngValue]="undefined">Sélectionner un centre</option>
              <option *ngFor="let centre of centres" [ngValue]="centre.id">{{ centre.nom }} · {{ centre.ville }}</option>
            </select>
          </label>
          <label>Spécialité *
            <select [(ngModel)]="form.specialiteId" [disabled]="!form.centreId">
              <option [ngValue]="undefined">Sélectionner une spécialité</option>
              <option *ngFor="let specialite of formSpecialites" [ngValue]="specialite.id">{{ specialite.nom }}</option>
            </select>
          </label>
        </div>
        <p class="form-error" *ngIf="formError">{{ formError }}</p>
        <div class="form-actions"><button class="btn btn-secondary" type="button" (click)="cancelForm()">Annuler</button><button class="btn btn-primary" type="button" (click)="saveSalle()" [disabled]="saving">{{ saving ? 'Enregistrement...' : 'Enregistrer' }}</button></div>
      </div>

      <div class="panel loading" *ngIf="loading">Chargement des salles...</div>
      <div class="panel empty" *ngIf="!loading && filteredSalles.length === 0">Aucune salle ne correspond aux filtres sélectionnés.</div>
      <div class="rooms-grid" *ngIf="!loading && filteredSalles.length > 0">
        <article class="room-card" *ngFor="let salle of filteredSalles">
          <div class="room-title"><h3>{{ salle.nom }}</h3><span>{{ salle.capacite }} places</span></div>
          <dl><div><dt>Centre</dt><dd>{{ salle.centre.nom }} · {{ salle.centre.ville }}</dd></div><div><dt>Spécialité</dt><dd>{{ salle.specialite.nom }}</dd></div></dl>
          <div class="actions"><button class="btn btn-secondary" type="button" (click)="startEdit(salle)">Modifier</button><button class="btn btn-danger" type="button" (click)="removeSalle(salle)">Supprimer</button></div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .rooms-shell { display: grid; gap: 1.25rem; }
    .page-header, .form-header, .room-title, .actions, .form-actions { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .page-header h2, .page-header p, h3 { margin: 0; } .page-header p { color: var(--text-muted); max-width: 720px; }
    .eyebrow { margin: 0 0 .35rem; color: var(--teal); font-size: .8rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    .panel { padding: 1.25rem; border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow-sm); }
    .filters, .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
    label { color: var(--text); font-weight: 700; } label select, label input { margin-top: .45rem; }
    .rooms-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; }
    .room-card { padding: 1.25rem; background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow-sm); }
    .room-title h3 { color: var(--primary); } .room-title span { padding: .3rem .65rem; border-radius: 999px; background: #fff3cd; color: #6b4f00; font-weight: 700; font-size: .85rem; }
    dl { display: grid; gap: .8rem; margin: 1.25rem 0; } dt { color: var(--text-muted); font-size: .78rem; font-weight: 700; text-transform: uppercase; } dd { margin: .2rem 0 0; color: var(--text); }
    .btn-danger { border-color: var(--error); } .close { border: 0; background: transparent; font-size: 1.8rem; cursor: pointer; color: var(--text-muted); }
    .form-error { color: var(--error); font-weight: 600; } .loading, .empty { color: var(--text-muted); text-align: center; }
    @media (max-width: 720px) { .filters, .form-grid { grid-template-columns: 1fr; } .page-header { align-items: flex-start; } }
  `]
})
export class SallesManagementComponent implements OnInit {
  centres: Centre[] = [];
  specialites: Specialite[] = [];
  salles: Salle[] = [];
  filterCentreId?: number;
  filterSpecialiteId?: number;
  filterSpecialites: Specialite[] = [];
  formSpecialites: Specialite[] = [];
  form: { nom: string; capacite: number; centreId?: number; specialiteId?: number } = this.emptyForm();
  editingSalle?: Salle;
  showForm = false;
  loading = false;
  saving = false;
  formError = '';
  isLocal = false;

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.isLocal = this.auth.isLocalManager();
    this.loadData();
  }

  get filteredSalles(): Salle[] {
    return this.salles.filter(salle => {
      const centreMatch = !this.filterCentreId || (salle.centre && salle.centre.id === this.filterCentreId);
      const specialiteMatch = !this.filterSpecialiteId || (salle.specialite && salle.specialite.id === this.filterSpecialiteId);
      console.log('Filtering salle:', salle.nom, 'centreMatch:', centreMatch, 'specialiteMatch:', specialiteMatch, 'filterCentreId:', this.filterCentreId, 'filterSpecialiteId:', this.filterSpecialiteId);
      return centreMatch && specialiteMatch;
    });
  }

  loadData(): void {
    this.loading = true;
    if (this.isLocal) {
      this.api.getMyCentre().subscribe({
        next: (centreRes) => {
          const centre = centreRes.data;
          console.log('Local manager centre loaded:', centre);
          if (centre) {
            this.centres = [centre];
            forkJoin({ specialites: this.api.getSpecialites(), salles: this.api.getManagerSalles() }).subscribe({
              next: ({ specialites, salles }) => {
                this.specialites = specialites.data || [];
                this.salles = salles.data || [];
                this.filterSpecialites = this.specialites;
                console.log('All specialties loaded:', this.specialites);
                console.log('Salles loaded:', this.salles);
                if (centre.id) {
                  this.filterCentreId = centre.id;
                  console.log('Setting filter centre ID to:', centre.id);
                  this.onFilterCentreChange();
                }
                this.loading = false;
              },
              error: (err) => {
                console.error('Error loading specialites/salles:', err);
                this.loading = false;
              }
            });
          } else {
            console.error('Centre data is null');
            this.loading = false;
          }
        },
        error: (err) => {
          console.error('Error loading my centre:', err);
          this.loading = false;
        }
      });
    } else {
      forkJoin({ centres: this.api.getAdminCentres(), specialites: this.api.getSpecialites(), salles: this.api.getSalles() }).subscribe({
        next: ({ centres, specialites, salles }) => {
          this.centres = centres.data || [];
          this.specialites = specialites.data || [];
          this.salles = salles.data || [];
          this.filterSpecialites = this.specialites;
          console.log('Admin mode - centres:', this.centres, 'specialites:', this.specialites, 'salles:', this.salles);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading admin data:', err);
          this.loading = false;
        }
      });
    }
  }

  onFilterCentreChange(): void {
    console.log('Filter centre changed to:', this.filterCentreId);
    this.filterSpecialiteId = undefined;
    this.loadSpecialitesForCentre(this.filterCentreId, list => this.filterSpecialites = list);
  }
  onFilterSpecialiteChange(): void {
    console.log('Filter specialite changed to:', this.filterSpecialiteId);
  }
  onFormCentreChange(): void { this.form.specialiteId = undefined; this.loadSpecialitesForCentre(this.form.centreId, list => this.formSpecialites = list); }
  startCreate(): void {
    this.editingSalle = undefined;
    this.form = this.emptyForm();
    if (this.isLocal && this.centres.length > 0) {
      this.form.centreId = this.centres[0].id;
      this.onFormCentreChange();
    }
    this.formSpecialites = [];
    this.formError = '';
    this.showForm = true;
  }
  startEdit(salle: Salle): void { this.editingSalle = salle; this.form = { nom: salle.nom, capacite: salle.capacite, centreId: salle.centre.id, specialiteId: salle.specialite.id }; this.formError = ''; this.showForm = true; this.loadSpecialitesForCentre(salle.centre.id, list => this.formSpecialites = list); }
  cancelForm(): void { this.showForm = false; this.formError = ''; }

  saveSalle(): void {
    if (!this.form.nom.trim() || !this.form.centreId || !this.form.specialiteId || this.form.capacite < 1) { this.formError = 'Renseignez un nom, une capacité, un centre et une spécialité.'; return; }
    const payload: Salle = { nom: this.form.nom.trim(), capacite: Number(this.form.capacite), centre: { id: this.form.centreId, nom: '', ville: '' }, specialite: { id: this.form.specialiteId, nom: '' } };
    this.saving = true;
    let request;
    if (this.isLocal) {
      request = this.editingSalle?.id ? this.api.updateManagerSalle(this.editingSalle.id, payload) : this.api.createManagerSalle(payload);
    } else {
      request = this.editingSalle?.id ? this.api.updateSalle(this.editingSalle.id, payload) : this.api.createSalle(payload);
    }
    request.subscribe({ next: () => { this.saving = false; this.cancelForm(); this.loadData(); }, error: (error) => { this.saving = false; this.formError = error.error?.message || 'Impossible d\'enregistrer la salle.'; } });
  }

  removeSalle(salle: Salle): void {
    if (!salle.id || !window.confirm(`Supprimer la salle « ${salle.nom} » ?`)) return;
    const request = this.isLocal ? this.api.deleteManagerSalle(salle.id) : this.api.deleteSalle(salle.id);
    request.subscribe({ next: () => this.loadData(), error: () => window.alert('Impossible de supprimer cette salle.') });
  }

  private loadSpecialitesForCentre(centreId: number | undefined, apply: (list: Specialite[]) => void): void {
    if (!centreId) { apply(this.specialites); return; }
    this.api.getCentreSpecialitesByCentre(centreId).subscribe({
      next: response => {
        const specialties = (response.data || [])
          .map(item => item.specialite)
          .filter((item): item is Specialite => !!item && !!item.id);
        console.log('Loaded specialties for centre', centreId, ':', specialties);
        apply(specialties);
      },
      error: (err) => {
        console.error('Error loading specialties for centre', centreId, ':', err);
        apply([]);
      }
    });
  }
  private emptyForm() { return { nom: '', capacite: 1, centreId: undefined, specialiteId: undefined }; }
}
