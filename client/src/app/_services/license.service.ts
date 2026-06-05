import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface LicenseStatus {
  licensed: boolean;
  fingerprint: string;
  customerName: string | null;
  expiryDate: string | null;
  daysLeft: number;
  reason: string | null;
}

export interface ActivationResult {
  success: boolean;
  error?: string;
  fingerprint?: string;
  customerName?: string;
  expiryDate?: string;
  daysLeft?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LicenseService {
  private statusSubject = new BehaviorSubject<LicenseStatus | null>(null);
  public status$ = this.statusSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Check the current license status from the server
   */
  checkStatus(): Observable<LicenseStatus> {
    return this.http.get<LicenseStatus>('/api/dreamz/license/status').pipe(
      tap(status => this.statusSubject.next(status))
    );
  }

  /**
   * Activate a license key
   */
  activate(licenseKey: string): Observable<ActivationResult> {
    return this.http.post<ActivationResult>('/api/dreamz/license/activate', { licenseKey });
  }

  /**
   * Whether the app is currently licensed
   */
  get isLicensed(): boolean {
    const s = this.statusSubject.value;
    return s ? s.licensed : false;
  }

  /**
   * Get the current status snapshot
   */
  get currentStatus(): LicenseStatus | null {
    return this.statusSubject.value;
  }
}
