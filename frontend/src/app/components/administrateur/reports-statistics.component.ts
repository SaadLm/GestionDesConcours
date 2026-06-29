import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Centre, Concours, ReportData, Specialite } from '../../models/models';

@Component({
  selector: 'app-reports-statistics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reports-section">
      <div class="section-header">
        <h2>Rapports et Statistiques</h2>
        <p>Générez et consultez les rapports sur les candidatures et les concours.</p>
      </div>

      <section class="report-selection">
        <h3>Générer un Rapport</h3>
        <div class="report-grid">
          <div class="report-card"
            *ngFor="let report of reportTypes"
            (click)="selectReportType(report.id)"
            [class.selected]="selectedReportType === report.id">
            <div class="card-icon">{{ report.icon }}</div>
            <h4>{{ report.title }}</h4>
            <p>{{ report.description }}</p>
          </div>
        </div>
      </section>

      <section *ngIf="selectedReportType" class="report-filters">
        <h3>Paramètres du Rapport</h3>
        <form (ngSubmit)="generateReport()" class="filter-form">
          <div class="form-row">
            <div class="form-group">
              <label>Période - Depuis</label>
              <input type="date" [(ngModel)]="reportFilters.dateFrom" name="dateFrom" class="form-control">
            </div>
            <div class="form-group">
              <label>Période - Jusqu'à</label>
              <input type="date" [(ngModel)]="reportFilters.dateTo" name="dateTo" class="form-control">
            </div>
          </div>

          <div class="form-row" *ngIf="selectedReportType === 'by_concours'">
            <div class="form-group">
              <label>Sélectionner un Concours</label>
              <select [(ngModel)]="reportFilters.concoursId" name="concoursId" class="form-control">
                <option [ngValue]="null">-- Tous les concours --</option>
                <option *ngFor="let c of concoursList" [ngValue]="c.id">{{ c.titre || c.nom }}</option>
              </select>
            </div>
          </div>

          <div class="form-row" *ngIf="selectedReportType === 'by_specialite'">
            <div class="form-group">
              <label>Sélectionner une Spécialité</label>
              <select [(ngModel)]="reportFilters.specialiteId" name="specialiteId" class="form-control">
                <option [ngValue]="null">-- Toutes les spécialités --</option>
                <option *ngFor="let s of specialitesList" [ngValue]="s.id">{{ s.nom }}</option>
              </select>
            </div>
          </div>

          <div class="form-row" *ngIf="selectedReportType === 'by_centre'">
            <div class="form-group">
              <label>Sélectionner un Centre</label>
              <select [(ngModel)]="reportFilters.centreId" name="centreId" class="form-control">
                <option [ngValue]="null">-- Tous les centres --</option>
                <option *ngFor="let c of centresList" [ngValue]="c.id">{{ c.nom }} - {{ c.ville }}</option>
              </select>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="generatingReport">
              <span *ngIf="!generatingReport">📊 Générer le Rapport</span>
              <span *ngIf="generatingReport">Génération en cours...</span>
            </button>
            <button type="button" class="btn btn-secondary" (click)="loadGlobalStats()" [disabled]="loadingGlobal">
              📈 Statistiques globales
            </button>
          </div>
        </form>
      </section>

      <div *ngIf="errorMessage" class="alert-message error">{{ errorMessage }}</div>

      <section *ngIf="currentReport" class="report-display">
        <div class="report-header">
          <h3>{{ getReportTitle() }}</h3>
          <p class="report-date" *ngIf="currentReport.generatedAt">Généré le: {{ currentReport.generatedAt }}</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Total</span>
            <span class="stat-value">{{ currentReport.totalCandidatures || 0 }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Validées</span>
            <span class="stat-value">{{ currentReport.validees || 0 }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">En Attente</span>
            <span class="stat-value">{{ currentReport.enAttente || 0 }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Rejetées</span>
            <span class="stat-value">{{ currentReport.rejetees || 0 }}</span>
          </div>
        </div>

        <div class="summary-row" *ngIf="currentReport.tauxReussite">
          <strong>Taux de réussite :</strong> {{ currentReport.tauxReussite }}
        </div>
      </section>

      <!-- <div *ngIf="!currentReport && selectedReportType && !generatingReport" class="info-message">
        <p>👈 Cliquez sur "Générer le Rapport" ou "Statistiques globales" pour afficher les données.</p>
      </div> -->
    </div>
  `,
  styles: [`
    .reports-section { animation: fadeIn 0.3s ease; }
    .section-header { margin-bottom: 2rem; }
    .section-header h2 { margin-bottom: 0.5rem; }
    .section-header p { color: var(--text-muted); }
    .report-selection, .report-filters, .report-display {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    .report-selection h3, .report-filters h3 { margin-top: 0; margin-bottom: 1.5rem; }
    .report-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    .report-card {
      padding: 1.5rem;
      background: var(--surface);
      border: 2px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }
    .report-card:hover, .report-card.selected {
      border-color: var(--primary);
      background: rgba(249, 115, 22, 0.05);
    }
    .card-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
    .report-card h4 { margin: 0.75rem 0; }
    .report-card p { margin: 0; font-size: 0.85rem; color: var(--text-muted); }
    .filter-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }
    .form-group { display: flex; flex-direction: column; }
    .form-group label { margin-bottom: 0.5rem; font-weight: 500; }
    .form-control {
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 4px;
      font-size: 1rem;
    }
    .form-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
    .report-header {
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }
    .report-date { margin: 0; font-size: 0.9rem; color: var(--text-muted); }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }
    .stat-card {
      padding: 1.5rem;
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.05), rgba(168, 85, 247, 0.05));
      border: 1px solid var(--border);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .stat-label { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem; }
    .stat-value { font-size: 2rem; font-weight: 700; color: var(--primary); }
    .summary-row { margin-top: 1.5rem; font-size: 1.1rem; }
    .info-message {
      padding: 1rem;
      background: rgba(59, 130, 246, 0.15);
      color: #1e40af;
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 4px;
    }
    .alert-message {
      padding: 1rem;
      border-radius: 4px;
      font-weight: 500;
      margin-bottom: 1rem;
    }
    .alert-message.error {
      background: rgba(220, 38, 38, 0.15);
      color: #991b1b;
      border: 1px solid rgba(220, 38, 38, 0.3);
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @media (max-width: 768px) {
      .report-grid, .form-row { grid-template-columns: 1fr; }
      .form-actions { flex-direction: column; }
    }
  `]
})
export class ReportsStatisticsComponent implements OnInit {
  selectedReportType: string | null = null;
  generatingReport = false;
  loadingGlobal = false;
  currentReport: ReportData | null = null;
  errorMessage = '';

  concoursList: Concours[] = [];
  specialitesList: Specialite[] = [];
  centresList: Centre[] = [];

  reportFilters = {
    dateFrom: '',
    dateTo: '',
    concoursId: null as number | null,
    specialiteId: null as number | null,
    centreId: null as number | null
  };

  reportTypes = [
    { id: 'by_concours', title: 'Par Concours', icon: '📋', description: 'Statistiques par concours' },
    { id: 'by_specialite', title: 'Par Spécialité', icon: '🎯', description: 'Statistiques par spécialité' },
    { id: 'by_centre', title: 'Par Centre d\'Examen', icon: '🏢', description: 'Statistiques par centre' }
  ];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getAdminConcours().subscribe({ next: (res) => this.concoursList = res.data || [] });
    this.api.getAdminSpecialites().subscribe({ next: (res) => this.specialitesList = res.data || [] });
    this.api.getAdminCentres().subscribe({ next: (res) => this.centresList = res.data || [] });
  }

  selectReportType(reportTypeId: string): void {
    this.selectedReportType = this.selectedReportType === reportTypeId ? null : reportTypeId;
    this.currentReport = null;
    this.errorMessage = '';
  }

  generateReport(): void {
    if (!this.selectedReportType) return;

    this.generatingReport = true;
    this.errorMessage = '';
    const params = {
      dateFrom: this.reportFilters.dateFrom || undefined,
      dateTo: this.reportFilters.dateTo || undefined
    };

    let request;
    if (this.selectedReportType === 'by_concours') {
      request = this.api.reportByConcours({ ...params, concoursId: this.reportFilters.concoursId ?? undefined });
    } else if (this.selectedReportType === 'by_specialite') {
      request = this.api.reportBySpecialite({ ...params, specialiteId: this.reportFilters.specialiteId ?? undefined });
    } else {
      request = this.api.reportByCentre({ ...params, centreId: this.reportFilters.centreId ?? undefined });
    }

    request.subscribe({
      next: (res) => {
        this.currentReport = res.data;
        this.generatingReport = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la génération du rapport.';
        this.generatingReport = false;
      }
    });
  }

  loadGlobalStats(): void {
    this.loadingGlobal = true;
    this.errorMessage = '';
    this.api.getGlobalStatistics().subscribe({
      next: (res) => {
        this.currentReport = res.data;
        this.selectedReportType = 'global';
        this.loadingGlobal = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des statistiques globales.';
        this.loadingGlobal = false;
      }
    });
  }

  getReportTitle(): string {
    if (this.selectedReportType === 'global') {
      return 'Statistiques Globales';
    }
    const type = this.reportTypes.find(t => t.id === this.selectedReportType);
    return type ? `Rapport - ${type.title}` : 'Rapport';
  }
}
