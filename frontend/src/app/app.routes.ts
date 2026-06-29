import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { InscriptionComponent } from './components/inscription/inscription.component';
import { TrackingComponent } from './components/tracking/tracking.component';
import { AuthComponent } from './components/auth/auth.component';
import { GestionnaireLocalComponent } from './components/gestionnaire-local/gestionnaire-local.component';
import { SupervisionLayoutComponent } from './components/supervision/supervision-layout.component';
import { UserManagementComponent } from './components/administrateur/user-management.component';
import { RolesAccessComponent } from './components/administrateur/roles-access.component';
import { PlatformSettingsComponent } from './components/administrateur/platform-settings.component';
import { CompetitionManagementComponent } from './components/administrateur/competition-management.component';
import { SpecialtyAllocationComponent } from './components/administrateur/specialty-allocation.component';
import { ReportsStatisticsComponent } from './components/administrateur/reports-statistics.component';
import { adminOnlyGuard, supervisionGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'postuler', component: InscriptionComponent },
  { path: 'suivi', component: TrackingComponent },
  { path: 'suivi/:numero', component: TrackingComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'gestionnaire-local', component: GestionnaireLocalComponent },
  {
    path: 'gestionnaire-global',
    component: SupervisionLayoutComponent,
    canActivate: [supervisionGuard],
    data: { layoutRole: 'global' },
    children: [
      { path: '', redirectTo: 'competitions', pathMatch: 'full' },
      { path: 'competitions', component: CompetitionManagementComponent },
      { path: 'specialties', component: SpecialtyAllocationComponent },
      { path: 'reports', component: ReportsStatisticsComponent }
    ]
  },
  {
    path: 'administrateur',
    component: SupervisionLayoutComponent,
    canActivate: [supervisionGuard],
    data: { layoutRole: 'admin' },
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      { path: 'users', component: UserManagementComponent, canActivate: [adminOnlyGuard] },
      { path: 'roles', component: RolesAccessComponent, canActivate: [adminOnlyGuard] },
      { path: 'settings', component: PlatformSettingsComponent, canActivate: [adminOnlyGuard] },
      { path: 'competitions', component: CompetitionManagementComponent },
      { path: 'specialties', component: SpecialtyAllocationComponent },
      { path: 'reports', component: ReportsStatisticsComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
