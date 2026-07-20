import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Centre, Concours, Candidature, Specialite, UploadedDocument } from '../../models/models';

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
                <span class="date-item" *ngIf="comp.centre">
                  <strong>Centre:</strong> {{ comp.centre.nom }} ({{ comp.centre.ville }})
                </span>
                <span class="date-item" *ngIf="comp.specialite">
                  <strong>Spécialité:</strong> {{ comp.specialite.nom }}
                </span>
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
              <button class="btn btn-secondary btn-sm" (click)="toggleCandidates(comp)">
                {{ activeConcoursId === comp.id ? '🔽 Masquer candidats' : '👥 Voir candidats' }}
              </button>
              <button class="btn btn-danger btn-sm" (click)="deleteConcours(comp.id!)">🗑️ Supprimer</button>
            </div>
          </div>
        </div>
      </section>

      <div class="overlay-backdrop" *ngIf="activeConcoursId" (click)="closeCandidates()"></div>
      <section class="candidates-overlay" *ngIf="activeConcoursId && selectedConcours" (click)="$event.stopPropagation()">
        <div class="overlay-header">
          <div>
            <h3>Candidats pour «{{ selectedConcours.titre || 'Concours' }}»</h3>
            <p class="muted">Liste des candidatures enregistrées et actions de validation.</p>
          </div>
          <button class="close-btn" type="button" (click)="closeCandidates()">✕</button>
        </div>

        <div *ngIf="loadingCandidates" class="loading-state">
          <div class="spinner"></div>
          <p>Chargement des candidatures...</p>
        </div>
        <div *ngIf="!loadingCandidates && candidatureList.length === 0" class="empty-state">
          <p>Aucune candidature liée à ce concours pour le moment.</p>
        </div>
        <div *ngIf="!loadingCandidates && candidatureList.length > 0" class="candidates-grid">
          <article class="candidate-card" *ngFor="let candidate of candidatureList">
            <div class="candidate-row">
              <div>
                <h5>{{ candidate.candidat.prenom }} {{ candidate.candidat.nom }}</h5>
                <span>{{ candidate.candidat.cin }}</span>
              </div>
              <span class="candidate-status">{{ candidate.statut || 'EN_ATTENTE' }}</span>
              <div class="document-actions" *ngIf="candidate.documents?.length">
                <button class="pdf-button" type="button" *ngFor="let document of candidate.documents" (click)="openDocument(candidate, document)" [title]="'Ouvrir ' + document.nomFichier">
                  📄 {{ document.typeDocument }}
                </button>
              </div>
              <button class="btn btn-secondary btn-sm" type="button" (click)="toggleCandidateDetails(candidate.id!)">
                {{ expandedCandidateId === candidate.id ? 'Masquer' : 'Détails' }}
              </button>
            </div>
            <div class="candidate-details" *ngIf="expandedCandidateId === candidate.id">
              <p><strong>Email :</strong> {{ candidate.candidat.email }}</p>
              <p><strong>Téléphone :</strong> {{ candidate.candidat.telephone }}</p>
              <p><strong>Centre :</strong> {{ candidate.centre.nom }}</p>
              <p><strong>Spécialité :</strong> {{ candidate.specialite.nom }}</p>
              <p><strong>Commentaire :</strong> {{ candidate.commentaire || 'Aucun' }}</p>
              <div class="diplomas" *ngIf="candidate.candidat.diplomes && candidate.candidat.diplomes.length > 0">
                <strong>Diplômes :</strong>
                <ul>
                  <li *ngFor="let diplome of candidate.candidat.diplomes">
                    {{ diplome.nomDiplome }} - {{ diplome.niveau }} ({{ diplome.anneeObtention }})
                  </li>
                </ul>
              </div>
            </div>
            <div class="candidate-actions">
              <button class="btn btn-success btn-sm" (click)="acceptCandidate(candidate)">✅ Accepter</button>
              <button class="btn btn-danger btn-sm" (click)="declineCandidate(candidate)">❌ Refuser</button>
            </div>
          </article>
        </div>
      </section>

      <div class="modal-backdrop" *ngIf="editingConcours" (click)="cancelEdit()"></div>
      <section class="edit-modal" *ngIf="editingConcours" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Modifier le concours</h3>
          <button class="close-btn" type="button" (click)="cancelEdit()">✕</button>
        </div>
        <form (ngSubmit)="saveConcours()" class="concours-form modal-form">
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
              <label>Centre associé *</label>
              <select [(ngModel)]="formConcours.centre" name="centre" class="form-control" [class.error]="errors['centre']" (change)="onCentreChange()">
                <option [ngValue]="undefined">-- Aucun centre --</option>
                <option *ngFor="let centre of centres" [ngValue]="centre">
                  {{ centre.nom }} — {{ centre.ville }}
                </option>
              </select>
              <span class="error-message" *ngIf="errors['centre']">{{ errors['centre'] }}</span>
            </div>

            <div class="form-group">
              <label>Spécialité *</label>
              <select [(ngModel)]="formConcours.specialite" name="specialite" class="form-control" [class.error]="errors['specialite']" [disabled]="!formConcours.centre">
                <option [ngValue]="undefined">-- Choisir une spécialité --</option>
                <option *ngFor="let spec of availableSpecialites" [ngValue]="spec">
                  {{ spec.nom }}
                </option>
              </select>
              <span class="error-message" *ngIf="errors['specialite']">{{ errors['specialite'] }}</span>
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

          <div class="form-actions modal-actions">
            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="savingConcours">
              <span *ngIf="!savingConcours">✏️ Mettre à Jour</span>
              <span *ngIf="savingConcours">Sauvegarde en cours...</span>
            </button>
            <button 
              type="button" 
              class="btn btn-secondary"
              (click)="cancelEdit()">
              Annuler
            </button>
          </div>

          <div *ngIf="message" [ngClass]="messageType" class="alert-message">
            {{ message }}
          </div>
        </form>
      </section>

      <!-- Create Concours Form -->
      <section class="create-concours-section" *ngIf="canManage && !editingConcours">
        <h3>Créer un Concours</h3>
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
              <label>Centre associé *</label>
              <select [(ngModel)]="formConcours.centre" name="centre" class="form-control" [class.error]="errors['centre']" (change)="onCentreChange()">
                <option [ngValue]="undefined">-- Aucun centre --</option>
                <option *ngFor="let centre of centres" [ngValue]="centre">
                  {{ centre.nom }} — {{ centre.ville }}
                </option>
              </select>
              <span class="error-message" *ngIf="errors['centre']">{{ errors['centre'] }}</span>
            </div>

            <div class="form-group">
              <label>Spécialité *</label>
              <select [(ngModel)]="formConcours.specialite" name="specialite" class="form-control" [class.error]="errors['specialite']" [disabled]="!formConcours.centre">
                <option [ngValue]="undefined">-- Choisir une spécialité --</option>
                <option *ngFor="let spec of availableSpecialites" [ngValue]="spec">
                  {{ spec.nom }}
                </option>
              </select>
              <span class="error-message" *ngIf="errors['specialite']">{{ errors['specialite'] }}</span>
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
              <span *ngIf="!savingConcours">➕ Créer Concours</span>
              <span *ngIf="savingConcours">Sauvegarde en cours...</span>
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
    .overlay-backdrop,
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      z-index: 20;
    }
    .candidates-overlay,
    .edit-modal {
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
    .edit-modal {
      width: min(95vw, 760px);
      max-height: 92vh;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .modal-header h3 {
      margin: 0;
      font-size: 1.4rem;
    }
    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .modal-actions {
      justify-content: flex-end;
      flex-wrap: wrap;
    }
    .form-actions.modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }
    .close-btn {
      border: none;
      background: transparent;
      color: var(--text);
      font-size: 1.4rem;
      cursor: pointer;
      line-height: 1;
    }
    .overlay-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .overlay-header h3 {
      margin: 0;
    }
    .close-btn {
      border: none;
      background: transparent;
      color: var(--text);
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
    }
    .candidates-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    .candidate-card {
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 1rem;
      background: rgba(248, 250, 252, 0.98);
      padding: 0.85rem 1rem;
    }
    .candidate-row {
      display: grid;
      grid-template-columns: minmax(170px, 1fr) auto minmax(180px, auto) auto;
      align-items: center;
      gap: 1rem;
    }
    .candidate-row h5 { margin: 0 0 0.2rem; }
    .candidate-row span { color: var(--text-muted); font-size: 0.88rem; }
    .candidate-status {
      padding: 0.3rem 0.55rem;
      border-radius: 999px;
      background: rgba(249, 115, 22, 0.1);
      color: var(--primary);
      white-space: nowrap;
    }
    .document-actions { display: flex; gap: 0.35rem; flex-wrap: wrap; }
    .pdf-button {
      border: 1px solid #f97316;
      background: #fff7ed;
      color: #9a3412;
      border-radius: 6px;
      padding: 0.3rem 0.45rem;
      cursor: pointer;
      font-size: 0.78rem;
    }
    .candidate-summary,
    .candidate-details {
      display: grid;
      gap: 0.35rem;
    }
    .candidate-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-top: 0.85rem;
    }
    .diplomas ul {
      margin: 0.5rem 0 0;
      padding-left: 1.2rem;
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
      .candidate-row { grid-template-columns: 1fr; gap: 0.55rem; }
    }
  `]
})
export class CompetitionManagementComponent implements OnInit {
  concours: Concours[] = [];
  centres: Centre[] = [];
  availableSpecialites: Specialite[] = [];
  editingConcours: Concours | null = null;
  formConcours: Concours = this.emptyForm();
  canManage = false;
  activeConcoursId?: number;
  selectedConcours?: Concours;
  candidatureList: Candidature[] = [];
  expandedCandidateId?: number;
  loadingCandidates = false;

  loadingConcours = false;
  savingConcours = false;
  errors: { [key: string]: string } = {};
  message = '';
  messageType = '';

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.canManage = this.auth.isAdmin() || this.auth.isGlobalManager() || this.auth.isLocalManager();
    this.loadConcours();
    this.loadCentres();
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
      statut: 'OUVERT',
      centre: undefined,
      specialite: undefined
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
    this.formConcours = {
      ...comp,
      centre: comp.centre ? { ...comp.centre } : undefined,
      specialite: comp.specialite ? { ...comp.specialite } : undefined
    };
    if (comp.centre && comp.centre.id) {
      this.loadSpecialitesForCentre(comp.centre.id);
    } else {
      this.availableSpecialites = [];
    }
  }

  toggleCandidates(comp: Concours): void {
    if (this.activeConcoursId === comp.id) {
      this.closeCandidates();
      return;
    }
    this.activeConcoursId = comp.id;
    this.selectedConcours = comp;
    this.loadCandidates(comp.id!);
  }

  closeCandidates(): void {
    this.activeConcoursId = undefined;
    this.selectedConcours = undefined;
    this.candidatureList = [];
    this.expandedCandidateId = undefined;
  }

  loadCandidates(concoursId: number): void {
    this.loadingCandidates = true;
    this.api.getCandidatures(undefined, concoursId).subscribe({
      next: (res) => {
        this.candidatureList = res.data || [];
        this.loadingCandidates = false;
      },
      error: () => {
        this.candidatureList = [];
        this.loadingCandidates = false;
      }
    });
  }

  toggleCandidateDetails(candidateId: number): void {
    this.expandedCandidateId = this.expandedCandidateId === candidateId ? undefined : candidateId;
  }

  openDocument(candidate: Candidature, document: UploadedDocument): void {
    if (!candidate.id) return;
    this.api.getCandidateDocument(candidate.id, document.id).subscribe({
      next: (file) => {
        const url = URL.createObjectURL(file);
        window.open(url, '_blank', 'noopener');
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: () => window.alert('Impossible d’ouvrir ce document.')
    });
  }

  acceptCandidate(candidate: Candidature): void {
    if (!candidate.id) return;
    this.api.validerCandidature(candidate.id).subscribe({
      next: () => this.loadCandidates(candidate.concours.id!),
      error: () => window.alert('Erreur lors de l’acceptation de la candidature.')
    });
  }

  declineCandidate(candidate: Candidature): void {
    if (!candidate.id) return;
    const commentaire = window.prompt('Motif du refus :', candidate.commentaire || '');
    if (commentaire === null) {
      return;
    }
    this.api.rejeterCandidature(candidate.id, commentaire).subscribe({
      next: () => this.loadCandidates(candidate.concours.id!),
      error: () => window.alert('Erreur lors du refus de la candidature.')
    });
  }

  cancelEdit(): void {
    this.editingConcours = null;
    this.formConcours = this.emptyForm();
    this.availableSpecialites = [];
    this.errors = {};
  }

  validateForm(): boolean {
    this.errors = {};

    if (!this.formConcours.titre?.trim() || (this.formConcours.titre?.trim().length ?? 0) < 3) {
      this.errors['titre'] = 'Le titre doit contenir au moins 3 caractères.';
    }
    if (!this.formConcours.centre || !this.formConcours.centre.id) {
      this.errors['centre'] = 'Le centre est requis.';
    }
    if (!this.formConcours.specialite || !this.formConcours.specialite.id) {
      this.errors['specialite'] = 'La spécialité est requise.';
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

  loadCentres(): void {
    if (this.auth.isLocalManager()) {
      this.api.getMyCentre().subscribe({
        next: (res: any) => {
          this.centres = [res.data as Centre];
          if (this.centres[0]) {
            this.formConcours.centre = this.centres[0];
            this.loadSpecialitesForCentre(this.centres[0].id!);
          }
        },
        error: () => {
          // centre list failed to load; form can still function without it
        }
      });
    } else {
      this.api.getCentres().subscribe({
        next: (res: any) => {
          this.centres = res.data as Centre[] || [];
        },
        error: () => {
          // centre list failed to load; form can still function without it
        }
      });
    }
  }

  loadSpecialitesForCentre(centreId: number): void {
    this.api.getCentreSpecialitesByCentre(centreId).subscribe({
      next: (res) => {
        this.availableSpecialites = (res.data || [])
          .map(alloc => alloc.specialite)
          .filter((spec): spec is Specialite => !!spec);
        
        if (this.formConcours.specialite && !this.availableSpecialites.some(s => s.id === this.formConcours.specialite?.id)) {
          this.formConcours.specialite = undefined;
        }
      },
      error: () => {
        this.availableSpecialites = [];
        this.formConcours.specialite = undefined;
      }
    });
  }

  onCentreChange(): void {
    if (this.formConcours.centre && this.formConcours.centre.id) {
      this.loadSpecialitesForCentre(this.formConcours.centre.id);
    } else {
      this.availableSpecialites = [];
      this.formConcours.specialite = undefined;
    }
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
