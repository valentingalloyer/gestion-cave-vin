import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {catchError, throwError} from 'rxjs';
import {ToastService} from './toast';

/**
 * Prévient l'utilisateur quand une modification (ajout, +/-, enregistrement, suppression) échoue,
 * pour qu'il ne croie pas qu'elle a été faite.
 * Ne gère pas :
 *  - les lectures (GET) : la liste affiche déjà son propre bandeau quand le serveur ne répond pas
 *  - la connexion et le changement de mot de passe : leurs écrans affichent leurs propres messages
 *  - les 401 : authInterceptor renvoie vers l'écran de connexion
 */
export const erreursInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const geree = req.method !== 'GET' && !req.url.includes('/auth/') && !req.url.includes('/compte/');

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (geree && err.status !== 401) {
        toastService.show(messageErreur(err), 'erreur');
      }
      return throwError(() => err);
    })
  );
};

function messageErreur(err: HttpErrorResponse): string {
  if (err.status === 0 || err.status >= 500) {
    return 'Le serveur ne répond pas : la modification n\'a pas été enregistrée. Réessayez dans un instant.';
  }
  if (err.status === 404) {
    return 'Cette bouteille n\'existe plus. Rechargez la page pour mettre la liste à jour.';
  }
  return 'La modification a été refusée par le serveur et n\'a pas été enregistrée.';
}
