import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface AuditEntry {
  id: number;
  timestamp: string;
  user: string;
  method: string;
  endpoint: string;
  status_code: number;
  ip: string;
  user_agent: string;
  body_summary: string;
  duration_ms: number;
}

export interface AuditResponse {
  rows: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-audit-log',
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.css']
})
export class AuditLogComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['timestamp', 'user', 'method', 'endpoint', 'status_code', 'ip', 'duration_ms', 'body_summary'];
  dataSource: AuditEntry[] = [];
  totalRows = 0;
  pageSize = 25;
  currentPage = 0;
  pageSizeOptions: number[] = [10, 25, 50, 100];

  // Filters
  filterUser = '';
  filterMethod = '';
  filterEndpoint = '';
  filterStartDate = '';
  filterEndDate = '';

  isLoading = false;

  private filterSubject = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadLogs();

    // Debounce filter inputs to avoid excessive API requests
    this.filterSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 0;
      if (this.paginator) {
        this.paginator.pageIndex = 0;
      }
      this.loadLogs();
    });
  }

  ngAfterViewInit() {
    // MatPaginator is ready
  }

  onFilterChange() {
    this.filterSubject.next();
  }

  clearFilters() {
    this.filterUser = '';
    this.filterMethod = '';
    this.filterEndpoint = '';
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadLogs();
  }

  loadLogs() {
    this.isLoading = true;
    let url = `/api/dreamz/audit?page=${this.currentPage + 1}&pageSize=${this.pageSize}`;

    if (this.filterUser) url += `&user=${encodeURIComponent(this.filterUser)}`;
    if (this.filterMethod) url += `&method=${encodeURIComponent(this.filterMethod)}`;
    if (this.filterEndpoint) url += `&endpoint=${encodeURIComponent(this.filterEndpoint)}`;
    if (this.filterStartDate) url += `&startDate=${encodeURIComponent(this.filterStartDate)}`;
    if (this.filterEndDate) url += `&endDate=${encodeURIComponent(this.filterEndDate)}`;

    this.http.get<AuditResponse>(url).subscribe(
      res => {
        this.dataSource = res.rows;
        this.totalRows = res.total;
        this.isLoading = false;
      },
      err => {
        console.error('Failed to load audit logs', err);
        this.isLoading = false;
      }
    );
  }

  pageChanged(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadLogs();
  }

  exportCsv() {
    // Open export link in a new window or trigger download
    window.open('/api/dreamz/audit/export', '_blank');
  }

  getMethodClass(method: string): string {
    switch (method?.toUpperCase()) {
      case 'POST': return 'badge-post';
      case 'PUT': return 'badge-put';
      case 'DELETE': return 'badge-delete';
      case 'PATCH': return 'badge-patch';
      default: return 'badge-other';
    }
  }

  getStatusClass(code: number): string {
    if (code >= 200 && code < 300) return 'status-success';
    if (code >= 300 && code < 400) return 'status-redirect';
    if (code >= 400) return 'status-error';
    return '';
  }
}
