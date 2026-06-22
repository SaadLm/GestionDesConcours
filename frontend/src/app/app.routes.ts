import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { InscriptionComponent } from './components/inscription/inscription.component';
import { TrackingComponent } from './components/tracking/tracking.component';
import { AuthComponent } from './components/auth/auth.component';
import { GestionnaireLocalComponent } from './components/gestionnaire-local/gestionnaire-local.component';
import { GestionnaireGlobalComponent } from './components/gestionnaire-global/gestionnaire-global.component';
import { AdministrateurComponent } from './components/administrateur/administrateur.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'postuler', component: InscriptionComponent },
  { path: 'suivi', component: TrackingComponent },
  { path: 'suivi/:numero', component: TrackingComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'gestionnaire-local', component: GestionnaireLocalComponent },
  { path: 'gestionnaire-global', component: GestionnaireGlobalComponent },
  { path: 'administrateur', component: AdministrateurComponent },
  { path: '**', redirectTo: '' }
];
