import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Chantier, Pointage, ScanResult } from './models';

@Injectable({ providedIn: 'root' })
export class PointageService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  chantiers(): Observable<{ data: Chantier[] }> {
    return this.http.get<{ data: Chantier[] }>(`${this.base}/chantiers`);
  }

  /**
   * Envoie un code scanné (qr_token ou matricule) au backend.
   */
  scan(code: string, chantierId: number, source: 'camera' | 'douchette'): Observable<ScanResult> {
    return this.http.post<ScanResult>(`${this.base}/pointages/scan`, {
      code,
      chantier_id: chantierId,
      source,
    });
  }

  pointagesDuJour(chantierId: number, date?: string): Observable<{ data: Pointage[] }> {
    const params: Record<string, string> = { chantier_id: String(chantierId) };
    if (date) params['date'] = date;
    return this.http.get<{ data: Pointage[] }>(`${this.base}/pointages`, { params });
  }
}
