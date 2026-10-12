import {computed, Injectable, signal} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Observable, retry, tap, throwError, timer} from 'rxjs';
import {environment} from '../../environments/environment';
import {CaveCacheService} from './cave-cache';

export interface AuthResponse {
  token: string;
  username: string;
}

export interface Credentials {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl + '/auth';

  private token = signal<string | null>(localStorage.getItem('token'));
  username = signal<string | null>(localStorage.getItem('username'));
  isLoggedIn = computed(() => this.token() !== null);

  constructor(private http: HttpClient,
              private caveCache: CaveCacheService) {}

  getToken(): string | null {
    return this.token();
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    // La cave du compte précédent ne doit pas apparaître au suivant
    this.caveCache.vider();
    this.token.set(null);
    this.username.set(null);
  }

  changerMotDePasse(ancien: string, nouveau: string): Observable<void> {
    return this.http.put<void>(environment.apiUrl + '/compte/mot-de-passe', {ancien, nouveau});
  }

  login(credentials: Credentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.apiUrl + '/login', credentials).pipe(
      // Le serveur peut dormir : on réessaie seulement si on ne l'a pas joint (pas sur un mauvais mot de passe)
      retry({
        count: 10,
        delay: (err: HttpErrorResponse) =>
          err.status === 0 || err.status >= 500 ? timer(3000) : throwError(() => err)
      }),
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('username', res.username);
        this.token.set(res.token);
        this.username.set(res.username);
      })
    );
  }
}
