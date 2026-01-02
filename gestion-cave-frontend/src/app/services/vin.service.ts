import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vin } from '../models/vin.model';
import {environment} from '../../environments/environment.prod';

@Injectable({ providedIn: 'root' })
export class VinService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getVins(): Observable<Vin[]> {
    return this.http.get<Vin[]>(this.apiUrl);
  }

  addVin(vin: Vin): Observable<Vin> {
    return this.http.post<Vin>(this.apiUrl, vin);
  }

  updateVin(vin: Vin): Observable<Vin> {
    return this.http.put<Vin>(`${this.apiUrl}/${vin.id}`, vin);
  }

  deleteVin(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
