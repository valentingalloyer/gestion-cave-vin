import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {catchError, throwError} from 'rxjs';
import {AuthService} from './auth-service';

/**
 * Ajoute le token JWT à chaque requête.
 * Un 401 (token expiré ou invalide) renvoie vers l'écran de connexion.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const requete = token
    ? req.clone({setHeaders: {Authorization: `Bearer ${token}`}})
    : req;

  return next(requete).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && token) {
        authService.logout();
      }
      return throwError(() => err);
    })
  );
};
