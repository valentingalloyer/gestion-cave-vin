import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vin } from '../models/vin.model';

@Injectable({ providedIn: 'root' })
export class VinService {
  private apiUrl = 'http://localhost:8080/api/vins';

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
}
