import { Component, OnInit } from '@angular/core';
import { LicenseService, LicenseStatus } from '../_services/license.service';

@Component({
  selector: 'app-license-overlay',
  templateUrl: './license-overlay.component.html',
  styleUrls: ['./license-overlay.component.css']
})
export class LicenseOverlayComponent implements OnInit {
  status: LicenseStatus | null = null;
  licenseKeyInput: string = '';
  loading: boolean = false;
  errorMsg: string | null = null;
  successMsg: string | null = null;

  constructor(private licenseService: LicenseService) {}

  ngOnInit() {
    this.checkLicense();
  }

  checkLicense() {
    this.loading = true;
    this.licenseService.checkStatus().subscribe(
      status => {
        this.status = status;
        this.loading = false;
      },
      err => {
        console.error('Failed to fetch license status', err);
        this.loading = false;
      }
    );
  }

  activateLicense() {
    if (!this.licenseKeyInput.trim()) {
      this.errorMsg = 'Please enter a license key.';
      return;
    }

    this.loading = true;
    this.errorMsg = null;
    this.successMsg = null;

    this.licenseService.activate(this.licenseKeyInput.trim()).subscribe(
      res => {
        this.loading = false;
        if (res.success) {
          this.successMsg = 'License activated successfully! Reloading...';
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          this.errorMsg = res.error || 'Invalid license key.';
        }
      },
      err => {
        this.loading = false;
        this.errorMsg = err.error?.error || 'Connection error. Please try again.';
      }
    );
  }

  copyFingerprint() {
    if (this.status?.fingerprint) {
      navigator.clipboard.writeText(this.status.fingerprint).then(() => {
        const btn = document.querySelector('.copy-btn');
        if (btn) {
          const oldText = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = oldText; }, 2000);
        }
      });
    }
  }
}
