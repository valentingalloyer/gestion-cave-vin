import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Degustation, NouvelleDegustation } from '../models/degustation.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DegustationService {
  private apiUrl = environment.apiUrl + '/degustations';

  constructor(private http: HttpClient) {}

  lister(): Observable<Degustation[]> {
    return this.http.get<Degustation[]>(this.apiUrl);
  }

  /** Note la dégustation et retire une bouteille de la cave */
  ouvrirBouteille(degustation: NouvelleDegustation): Observable<Degustation> {
    return this.http.post<Degustation>(this.apiUrl, degustation);
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
