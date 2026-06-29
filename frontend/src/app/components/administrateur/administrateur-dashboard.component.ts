import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-administrateur-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container fade-in">
      <div class="hero admin-hero">
        <h1 class="font-outfit">Tableau de bord Administrateur</h1>
        <p>Gestion complète de la plateforme : comptes, rôles, paramètres et supervision globale des concours.</p>
      </div>

      <div class="tabs-navigation">
        <nav class="tabs-menu">
          <a 
            *ngFor="let tab of tabs" 
            [routerLink]="tab.route"
            routerLinkActive="active"
            class="tab-link"
            [title]="tab.description">
            <span class="tab-icon">{{ tab.icon }}</span>
            {{ tab.label }}
          </a>
        </nav>
      </div>

      <div class="tabs-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .admin-hero {
      margin-bottom: 2rem;
    }
    .tabs-navigation {
      margin-bottom: 2rem;
      border-bottom: 2px solid var(--border);
    }
    .tabs-menu {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .tab-link {
      padding: 1rem 1.5rem;
      text-decoration: none;
      color: var(--text-muted);
      border-bottom: 3px solid transparent;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 500;
      cursor: pointer;
    }
    .tab-link:hover {
      color: var(--primary);
      background: rgba(249, 115, 22, 0.05);
    }
    .tab-link.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }
    .tab-icon {
      font-size: 1.2rem;
    }
    .tabs-content {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 2rem;
    }
    @media (max-width: 768px) {
      .tab-link {
        padding: 0.75rem 1rem;
        font-size: 0.9rem;
      }
      .tab-icon {
        display: none;
      }
    }
  `]
})
export class AdministrateurDashboardComponent implements OnInit {
  tabs = [
    {
      label: 'Comptes Utilisateurs',
      route: 'users',
      icon: '👤',
      description: 'Gérer les comptes utilisateurs'
    },
    {
      label: 'Rôles et Accès',
      route: 'roles',
      icon: '🔐',
      description: 'Gérer les rôles et les droits d\'accès'
    },
    {
      label: 'Paramètres Plateforme',
      route: 'settings',
      icon: '⚙️',
      description: 'Configuration générale de la plateforme'
    },
    {
      label: 'Concours',
      route: 'competitions',
      icon: '📋',
      description: 'Configuration des concours et spécialités'
    },
    {
      label: 'Allocation Spécialités',
      route: 'specialties',
      icon: '🎯',
      description: 'Attribution des spécialités aux centres'
    },
    {
      label: 'Rapports & Statistiques',
      route: 'reports',
      icon: '📊',
      description: 'Génération de rapports et statistiques'
    }
  ];

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    // Component initialization if needed
  }
}
