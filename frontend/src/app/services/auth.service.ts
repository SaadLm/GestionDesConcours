import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { RoleType } from '../models/models';

export interface UserSession {
  profile: RoleType;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<UserSession | null>(null);
  public user$: Observable<UserSession | null> = this.userSubject.asObservable();

  private baseUrl = 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) {
    // restore session if token present
    const token = localStorage.getItem('auth_token');
    const email = localStorage.getItem('auth_email');
    if (token && email) {
      const profile = this.decodeRoleFromToken(token) || ('Gestionnaire global' as RoleType);
      this.userSubject.next({ profile, email });
    }
  }

  login(email: string, password: string): Observable<UserSession> {
    return this.http.post<{ token: string }>(`${this.baseUrl}/auth/login`, { email, password }).pipe(
      map((res) => {
        const token = res.token;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_email', email);
        const profile = this.decodeRoleFromToken(token) || ('Gestionnaire global' as RoleType);
        const session: UserSession = { profile, email };
        this.userSubject.next(session);
        return session;
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_email');
    this.userSubject.next(null);
  }

  get currentUser(): UserSession | null {
    return this.userSubject.value;
  }

  isAdmin(): boolean {
    return this.currentUser?.profile === 'Administrateur';
  }

  isGlobalManager(): boolean {
    return this.currentUser?.profile === 'Gestionnaire global';
  }

  isLocalManager(): boolean {
    return this.currentUser?.profile === 'Gestionnaire local';
  }

  canManagePlatform(): boolean {
    return this.isAdmin();
  }

  private decodeRoleFromToken(token: string): RoleType | undefined {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return undefined;
      const payload = JSON.parse(atob(parts[1]));
      // common claim names: role, roles, authorities
      const roleClaim = payload.role || payload.roles || payload.authorities || payload.authority;
      if (!roleClaim) return undefined;
      const roleStr = Array.isArray(roleClaim) ? roleClaim[0] : roleClaim;
      if (roleStr.includes('LOCAL')) return 'Gestionnaire local';
      if (roleStr.includes('GLOBAL')) return 'Gestionnaire global';
      if (roleStr.includes('ADMIN')) return 'Administrateur';
      return undefined;
    } catch (e) {
      return undefined;
    }
  }
}
