/**
 * Violation types detected by the audit guard.
 *
 * - console-log-handler: onClick/onX handler whose body is only console.log / alert / TODO string
 * - empty-handler: onClick={undefined} or onClick={() => {}}
 * - dead-href: href pointing to a route that doesn't resolve in app/
 * - proximamente-label: "Próximamente" / "Coming soon" / "WIP" in a clickable element's text
 */
export type ViolationType =
  | 'console-log-handler'
  | 'empty-handler'
  | 'dead-href'
  | 'proximamente-label';

export interface Violation {
  type: ViolationType;
  file: string;
  line: number;
  snippet: string;
}

export interface AuditReport {
  violations: Violation[];
  scannedFiles: number;
}

export interface BaselineEntry {
  type: ViolationType;
  file: string;
  line: number;
  snippet: string;
}
