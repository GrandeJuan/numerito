import { readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

/**
 * Resolves all valid routes from a Next.js App Router directory.
 * Handles route groups (parentheses), dynamic segments ([param]),
 * and catch-all routes ([...param]).
 */
export function resolveAppRoutes(appDir: string): Set<string> {
  const routes = new Set<string>();
  collectRoutes(appDir, appDir, routes);
  return routes;
}

function collectRoutes(
  dir: string,
  appDir: string,
  routes: Set<string>,
): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }

    if (!stat.isDirectory()) {
      // If this directory has a page.tsx, register the route
      if (entry === 'page.tsx' || entry === 'page.ts' || entry === 'page.jsx' || entry === 'page.js') {
        const routePath = dirToRoute(relative(appDir, dir));
        routes.add(routePath);
      }
      continue;
    }

    // Recurse into subdirectories
    collectRoutes(fullPath, appDir, routes);
  }
}

/**
 * Converts a filesystem path relative to app/ into a URL route path.
 * - Route groups like (dashboard) are stripped (they don't appear in the URL)
 * - Dynamic segments like [id] become :id (matched as wildcard)
 * - Catch-all like [...slug] become * wildcard
 */
function dirToRoute(relPath: string): string {
  if (relPath === '' || relPath === '.') return '/';

  const segments = relPath.split(/[/\\]/);
  const routeSegments: string[] = [];

  for (const seg of segments) {
    // Route groups: (name) — stripped from URL
    if (seg.startsWith('(') && seg.endsWith(')')) {
      continue;
    }
    routeSegments.push(seg);
  }

  const route = '/' + routeSegments.join('/');
  return route === '/' ? '/' : route;
}

/**
 * Checks if a given href matches any known route.
 * Handles:
 * - Exact matches: /clientes → /clientes
 * - Dynamic segments: /facturacion/123 → /facturacion/[id]
 * - Hash/query stripping: /clientes?page=2 → /clientes
 * - External URLs (https://, http://, mailto:, tel:) — always valid
 * - Anchor-only (#section) — always valid
 * - Relative paths — skipped (valid within component context)
 */
export function isValidHref(href: string, routes: Set<string>): boolean {
  // External URLs are always valid
  if (/^(https?:|mailto:|tel:|#)/.test(href)) return true;

  // Relative paths (no leading /) — can't validate statically
  if (!href.startsWith('/')) return true;

  // Strip query string and hash
  const cleanHref = href.split(/[?#]/)[0];

  // Exact match
  if (routes.has(cleanHref)) return true;

  // Try dynamic segment matching
  for (const route of routes) {
    if (matchDynamicRoute(cleanHref, route)) return true;
  }

  return false;
}

function matchDynamicRoute(href: string, routePattern: string): boolean {
  // Only try matching routes that have dynamic segments
  if (!routePattern.includes('[')) return false;

  const hrefParts = href.split('/').filter(Boolean);
  const routeParts = routePattern.split('/').filter(Boolean);

  // Catch-all route
  const catchAllIdx = routeParts.findIndex(
    (p) => p.startsWith('[...') || p.startsWith('[[...'),
  );
  if (catchAllIdx >= 0) {
    // Everything before the catch-all must match
    for (let i = 0; i < catchAllIdx; i++) {
      if (i >= hrefParts.length) return false;
      if (!routeParts[i].startsWith('[') && routeParts[i] !== hrefParts[i])
        return false;
    }
    return hrefParts.length >= catchAllIdx;
  }

  // Same number of segments required for non-catch-all
  if (hrefParts.length !== routeParts.length) return false;

  for (let i = 0; i < routeParts.length; i++) {
    const rp = routeParts[i];
    if (rp.startsWith('[') && rp.endsWith(']')) {
      // Dynamic segment — matches anything
      continue;
    }
    if (rp !== hrefParts[i]) return false;
  }

  return true;
}
