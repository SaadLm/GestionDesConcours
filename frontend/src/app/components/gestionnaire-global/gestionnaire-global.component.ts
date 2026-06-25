import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Concours, Specialite, Centre, ApiResponse, Candidature } from '../../models/models';

interface RapportSimule {
  type: string;
  valeur: string;
}

interface ConcoursConfig {
  id: number;
  nom: string;
  specialites: string[];
}

interface CentreSpecialite {
  centre: string;
  specialite: string;
}

@Component({
  selector: 'app-gestionnaire-global',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container fade-in">
      <div class="hero global-hero">
        <h1 class="font-outfit">Tableau de bord Gestionnaire global</h1>
        <p>Supervisez l’ensemble des candidatures, paramétrez les concours et suivez les rapports nationaux.</p>
      </div>

      <div class="cards-grid">
        <div class="glass-card summary-card">
          <h2>Fonctionnalités clés</h2>
          <ul>
            <li>Accès à l’ensemble des candidatures de tous les centres</li>
            <li>Supervision globale du processus de candidature</li>
            <li>Configuration des concours et des spécialités associées</li>
            <li>Attribution des spécialités aux centres</li>
            <li>Génération de rapports par concours, spécialité et centre</li>
          </ul>
        </div>
        <div class="glass-card summary-card">
          <h2>Statistiques rapides</h2>
          <ul>
            <li>Candidatures totales : 1 248</li>
            <li>Centres actifs : 14</li>
            <li>Spécialités ouvertes : 8</li>
          </ul>
        </div>
      </div>

      <section class="config-section">
        <h2>Configuration des concours</h2>
        <div class="config-grid">
          <div class="glass-card config-card">
            <h3>Concours disponibles</h3>
            <ul>
              <li *ngFor="let concours of concoursList">{{ concours.nom }} - {{ getSpecialitesText(concours) }}</li>
            </ul>
          </div>
          <div class="glass-card config-card">
            <h3>Attribuer une spécialité</h3>
            <div class="input-group">
              <label>Centre</label>
              <select [(ngModel)]="selectedCentre">
                <option *ngFor="let centre of centresList" [value]="centre.nom">{{ centre.nom }}</option>
              </select>
            </div>
            <div class="input-group">
              <label>Spécialité</label>
              <select [(ngModel)]="selectedSpecialite">
                <option *ngFor="let specialite of specialites" [value]="specialite">{{ specialite }}</option>
              </select>
            </div>
            <button class="btn btn-primary" type="button" (click)="assignSpecialite()">Attribuer</button>
            <p *ngIf="assignMessage" class="alert alert-info">{{ assignMessage }}</p>
          </div>
        </div>
      </section>

      <section class="table-section">
        <h2>Candidatures globales</h2>
        <table>
          <thead>
            <tr>
              <th>Centre</th>
              <th>Spécialité</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of centreSpecialites">
              <td>{{ item.centre }}</td>
              <td>{{ item.specialite }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="table-section">
        <h2>Rapports et statistiques</h2>
        <div class="reports-grid">
          <div class="report-card" *ngFor="let rapport of rapports">
            <h3>{{ rapport.type }}</h3>
            <p>{{ rapport.valeur }}</p>
          </div>
        </div>
        <button class="btn btn-primary" type="button" (click)="generateReport()">Rafraîchir les rapports</button>
      </section>
    </div>
  `,
  styles: [`
    .global-hero {
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
    .config-section {
      margin-top: 2rem;
    }
    .config-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .config-card {
      padding: 1.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface);
    }
    .input-group {
      margin-bottom: 1rem;
    }
    .table-section {
      margin-top: 2rem;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--surface);
      border: 1px solid var(--border);
      margin-bottom: 1rem;
    }
    th, td {
      padding: 1rem;
      border-bottom: 1px solid var(--border);
      text-align: left;
    }
    th {
      background: #f8fafc;
      color: var(--secondary);
    }
    .reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }
    .report-card {
      padding: 1.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      min-height: 160px;
    }
    .report-card h3 {
      margin-bottom: 0.75rem;
      color: var(--primary);
    }
    .alert-info {
      margin-top: 1rem;
      padding: 0.85rem 1rem;
      border-radius: var(--radius);
      background: rgba(249, 115, 22, 0.12);
      color: var(--primary);
      border: 1px solid rgba(249, 115, 22, 0.25);
    }
    @media (max-width: 760px) {
      .report-card {
        min-height: auto;
      }
    }
  `]
})
export class GestionnaireGlobalComponent {
  assignMessage = '';

  concoursList: Concours[] = [];
  centresList: Centre[] = [];
  specialites: string[] = [];

  selectedCentre = '';
  selectedSpecialite = '';

  rapports: RapportSimule[] = [
    { type: 'Candidatures par concours', valeur: '—' },
    { type: 'Candidatures par spécialité', valeur: '—' },
    { type: 'Candidatures par centre', valeur: '—' }
  ];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadConfigData();
  }

  private loadConfigData(): void {
    this.api.getConcours().subscribe({ next: (res: ApiResponse<Concours[]>) => this.concoursList = res.data || [], error: (e)=> console.error(e) });
    this.api.getSpecialites().subscribe({ next: (res: ApiResponse<Specialite[]>) => this.specialites = (res.data || []).map(s => s.nom), error: (e)=> console.error(e) });
    this.api.getCentres().subscribe({ next: (res: ApiResponse<Centre[]>) => { this.centresList = res.data || []; if (this.centresList.length) this.selectedCentre = this.centresList[0].nom; }, error: (e)=> console.error(e) });
  }

  get centreSpecialites() {
    return this.centresList.map(c => ({ centre: c.nom, specialite: '' }));
  }

  getSpecialitesText(concours: Concours): string {
    return (concours.specialites || []).map(s => s.nom).join(', ');
  }

  assignSpecialite() {
    this.assignMessage = `Spécialité ${this.selectedSpecialite} attribuée à ${this.selectedCentre}.`;
  }

  generateReport() {
    this.rapports = [
      { type: 'Candidatures par concours', valeur: '745 candidatures pour Concours d’entrée 2026' },
      { type: 'Candidatures par spécialité', valeur: '320 en Informatique, 260 en Gestion, 165 en Marketing' },
      { type: 'Candidatures par centre', valeur: 'Casablanca 420, Rabat 295, Fès 206' }
    ];
    this.assignMessage = 'Rapports mis à jour.';
  }
}
