import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Candidature, Centre, Concours, Specialite } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = '/api/v1';

  constructor(private http: HttpClient) {}

  // Candidat Public Endpoints
  postuler(candidature: Candidature): Observable<ApiResponse<Candidature>> {
    return this.http.post<ApiResponse<Candidature>>(`${this.baseUrl}/public/postuler`, candidature);
  }

  login(email: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.baseUrl}/auth/login`, { email, password });
  }

  suivreCandidature(numero: string): Observable<ApiResponse<Candidature>> {
    return this.http.get<ApiResponse<Candidature>>(`${this.baseUrl}/public/suivi/${numero}`);
  }

  getConcours(): Observable<ApiResponse<Concours[]>> {
    return this.http.get<ApiResponse<Concours[]>>(`${this.baseUrl}/public/concours`);
  }

  getSpecialites(): Observable<ApiResponse<Specialite[]>> {
    return this.http.get<ApiResponse<Specialite[]>>(`${this.baseUrl}/public/specialites`);
  }

  getCentres(): Observable<ApiResponse<Centre[]>> {
    return this.http.get<ApiResponse<Centre[]>>(`${this.baseUrl}/public/centres`);
  }

  // Manager Endpoints (Requires Auth)
  getCandidatures(centreId?: number): Observable<ApiResponse<Candidature[]>> {
    const url = centreId ? `${this.baseUrl}/manager/candidatures?centreId=${centreId}` : `${this.baseUrl}/manager/candidatures`;
    return this.http.get<ApiResponse<Candidature[]>>(url);
  }

  validerCandidature(id: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/manager/candidatures/${id}/valider`, {});
  }

  rejeterCandidature(id: number, commentaire: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/manager/candidatures/${id}/rejeter?commentaire=${commentaire}`, {});
  }
}
