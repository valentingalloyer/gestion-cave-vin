import {Injectable, signal} from '@angular/core';
import {tap} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private token = signal<string | null>(localStorage.getItem('token'));

  login(credentials: any) {
    return this.http.post<any>('.../api/auth/login', credentials).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        this.token.set(res.token);
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    this.token.set(null);
  }
}
