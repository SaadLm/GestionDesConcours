import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Candidature, Centre, CentreSpecialiteAllocation, Concours, ReportData, Specialite, UserBase } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8080/api/v1';

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

  // Rooms / assignment
  getSallesWithCandidates(centreId: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/manager/centres/${centreId}/salles-with-candidates`);
  }

  assignSalle(candidatureId: number, salleId?: number): Observable<ApiResponse<void>> {
    const url = salleId != null
      ? `${this.baseUrl}/manager/candidatures/${candidatureId}/salle?salleId=${salleId}`
      : `${this.baseUrl}/manager/candidatures/${candidatureId}/salle`;
    return this.http.put<ApiResponse<void>>(url, {});
  }

  // Admin user management
  getUsers(): Observable<ApiResponse<UserBase[]>> {
    return this.http.get<ApiResponse<UserBase[]>>(`${this.baseUrl}/admin/users`);
  }

  getUser(id: number): Observable<ApiResponse<UserBase>> {
    return this.http.get<ApiResponse<UserBase>>(`${this.baseUrl}/admin/users/${id}`);
  }

  createUser(payload: any): Observable<ApiResponse<UserBase>> {
    return this.http.post<ApiResponse<UserBase>>(`${this.baseUrl}/admin/users`, payload);
  }

  updateUser(id: number, payload: any): Observable<ApiResponse<UserBase>> {
    return this.http.put<ApiResponse<UserBase>>(`${this.baseUrl}/admin/users/${id}`, payload);
  }

  deleteUser(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/admin/users/${id}`);
  }

  // Admin competitions
  getAdminConcours(): Observable<ApiResponse<Concours[]>> {
    return this.http.get<ApiResponse<Concours[]>>(`${this.baseUrl}/admin/concours`);
  }

  createConcours(payload: Concours): Observable<ApiResponse<Concours>> {
    return this.http.post<ApiResponse<Concours>>(`${this.baseUrl}/admin/concours`, payload);
  }

  updateConcours(id: number, payload: Concours): Observable<ApiResponse<Concours>> {
    return this.http.put<ApiResponse<Concours>>(`${this.baseUrl}/admin/concours/${id}`, payload);
  }

  deleteConcours(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/admin/concours/${id}`);
  }

  // Admin specialties
  getAdminSpecialites(): Observable<ApiResponse<Specialite[]>> {
    return this.http.get<ApiResponse<Specialite[]>>(`${this.baseUrl}/admin/specialites`);
  }

  createSpecialite(payload: Specialite): Observable<ApiResponse<Specialite>> {
    return this.http.post<ApiResponse<Specialite>>(`${this.baseUrl}/admin/specialites`, payload);
  }

  updateSpecialite(id: number, payload: Specialite): Observable<ApiResponse<Specialite>> {
    return this.http.put<ApiResponse<Specialite>>(`${this.baseUrl}/admin/specialites/${id}`, payload);
  }

  deleteSpecialite(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/admin/specialites/${id}`);
  }

  // Admin centres
  getAdminCentres(): Observable<ApiResponse<Centre[]>> {
    return this.http.get<ApiResponse<Centre[]>>(`${this.baseUrl}/admin/centres`);
  }

  // Admin specialty allocations
  getCentreSpecialitesByCentre(centreId: number): Observable<ApiResponse<CentreSpecialiteAllocation[]>> {
    return this.http.get<ApiResponse<CentreSpecialiteAllocation[]>>(`${this.baseUrl}/admin/centre-specialites/centre/${centreId}`);
  }

  createCentreSpecialite(payload: { centreId: number; specialiteId: number; nombrePlaces: number }): Observable<ApiResponse<CentreSpecialiteAllocation>> {
    return this.http.post<ApiResponse<CentreSpecialiteAllocation>>(`${this.baseUrl}/admin/centre-specialites`, {
      centre: { id: payload.centreId },
      specialite: { id: payload.specialiteId },
      nombrePlaces: payload.nombrePlaces
    });
  }

  updateCentreSpecialite(id: number, nombrePlaces: number): Observable<ApiResponse<CentreSpecialiteAllocation>> {
    return this.http.put<ApiResponse<CentreSpecialiteAllocation>>(`${this.baseUrl}/admin/centre-specialites/${id}`, {
      nombrePlaces
    });
  }

  deleteCentreSpecialite(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/admin/centre-specialites/${id}`);
  }

  // Admin reports
  getGlobalStatistics(): Observable<ApiResponse<ReportData>> {
    return this.http.get<ApiResponse<ReportData>>(`${this.baseUrl}/admin/reports/global-statistics`);
  }

  reportByConcours(params?: { concoursId?: number; dateFrom?: string; dateTo?: string }): Observable<ApiResponse<ReportData>> {
    return this.http.post<ApiResponse<ReportData>>(`${this.baseUrl}/admin/reports/by-concours`, null, { params: this.reportParams(params) });
  }

  reportBySpecialite(params?: { specialiteId?: number; dateFrom?: string; dateTo?: string }): Observable<ApiResponse<ReportData>> {
    return this.http.post<ApiResponse<ReportData>>(`${this.baseUrl}/admin/reports/by-specialite`, null, { params: this.reportParams(params) });
  }

  reportByCentre(params?: { centreId?: number; dateFrom?: string; dateTo?: string }): Observable<ApiResponse<ReportData>> {
    return this.http.post<ApiResponse<ReportData>>(`${this.baseUrl}/admin/reports/by-centre`, null, { params: this.reportParams(params) });
  }

  private reportParams(params?: { concoursId?: number; specialiteId?: number; centreId?: number; dateFrom?: string; dateTo?: string }): Record<string, string> {
    const result: Record<string, string> = {};
    if (!params) return result;
    if (params.concoursId != null) result['concoursId'] = String(params.concoursId);
    if (params.specialiteId != null) result['specialiteId'] = String(params.specialiteId);
    if (params.centreId != null) result['centreId'] = String(params.centreId);
    if (params.dateFrom) result['dateFrom'] = params.dateFrom;
    if (params.dateTo) result['dateTo'] = params.dateTo;
    return result;
  }
}
