import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { InscriptionComponent } from './components/inscription/inscription.component';
import { TrackingComponent } from './components/tracking/tracking.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'postuler', component: InscriptionComponent },
  { path: 'suivi', component: TrackingComponent },
  { path: 'suivi/:numero', component: TrackingComponent },
  { path: '**', redirectTo: '' }
];
