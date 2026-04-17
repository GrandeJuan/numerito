import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.resolve(__dirname, '../..');

const BOUNDED_CONTEXTS = [
  'iam',
  'estudio',
  'clientes',
  'contabilidad',
  'nomina',
  'documentos',
  'integraciones',
  'obligaciones',
  'tareas',
  'facturacion',
];

const READ_MODEL_CONTEXTS = [
  'administracion',
  'dashboard',
  'portal',
];

function findFiles(
  dir: string,
  pattern: RegExp,
  excludePattern?: RegExp,
): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath, pattern, excludePattern));
    } else if (
      pattern.test(entry.name) &&
      (!excludePattern || !excludePattern.test(entry.name))
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

function extractImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g;
  const imports: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

const SPEC_PATTERN = /\.spec\.ts$/;

function findFilesInLayer(layer: string): string[] {
  const files: string[] = [];
  for (const ctx of BOUNDED_CONTEXTS) {
    const layerDir = path.join(SRC_DIR, ctx, layer);
    files.push(...findFiles(layerDir, /\.ts$/, SPEC_PATTERN));
  }
  return files;
}

function relativeTo(filePath: string): string {
  return path.relative(SRC_DIR, filePath).replace(/\\/g, '/');
}

describe('Architecture rules', () => {
  describe('Domain layer isolation', () => {
    it('domain/ files must NOT import from application/ or infrastructure/', () => {
      const domainFiles = findFilesInLayer('domain');
      const violations: string[] = [];

      for (const file of domainFiles) {
        const imports = extractImports(file);
        for (const imp of imports) {
          if (imp.includes('/application/') || imp.includes('/infrastructure/')) {
            violations.push(
              `${relativeTo(file)} imports "${imp}"`,
            );
          }
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe('Application layer', () => {
    it('application/ files must NOT import from infrastructure/', () => {
      const appFiles = findFilesInLayer('application');
      const violations: string[] = [];

      for (const file of appFiles) {
        const imports = extractImports(file);
        for (const imp of imports) {
          if (imp.includes('/infrastructure/')) {
            violations.push(
              `${relativeTo(file)} imports "${imp}"`,
            );
          }
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe('No cross-context imports', () => {
    it('bounded contexts must not import from other contexts internals', () => {
      const violations: string[] = [];

      for (const ctx of BOUNDED_CONTEXTS) {
        const ctxDir = path.join(SRC_DIR, ctx);
        const files = findFiles(ctxDir, /\.ts$/, SPEC_PATTERN);

        for (const file of files) {
          const rel = relativeTo(file);

          // MikroORM persistence files (schemas + repo implementations) are allowed to cross-import for FK relationships
          if (rel.includes('/infrastructure/persistence/')) continue;

          const imports = extractImports(file);
          for (const imp of imports) {
            // Skip external packages and shared imports
            if (!imp.startsWith('.') && !imp.startsWith('/')) continue;
            if (imp.includes('/shared/')) continue;
            if (imp.startsWith('@numerito/shared')) continue;

            // Check if this relative import resolves to another context
            const resolvedDir = path.dirname(
              path.resolve(path.dirname(file), imp),
            );
            const relFromSrc = path
              .relative(SRC_DIR, resolvedDir)
              .replace(/\\/g, '/');

            for (const otherCtx of BOUNDED_CONTEXTS) {
              if (otherCtx === ctx) continue;
              if (
                relFromSrc === otherCtx ||
                relFromSrc.startsWith(`${otherCtx}/`)
              ) {
                violations.push(
                  `${relativeTo(file)} imports from context "${otherCtx}" via "${imp}"`,
                );
              }
            }
          }
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe('Entity structure', () => {
    it('all *.entity.ts files should have a static create() method', () => {
      const entityFiles = findFiles(SRC_DIR, /\.entity\.ts$/, SPEC_PATTERN);
      // Exclude base entity
      const domainEntities = entityFiles.filter(
        (f) => !f.includes('base.entity.ts'),
      );
      const violations: string[] = [];

      for (const file of domainEntities) {
        const content = fs.readFileSync(file, 'utf-8');
        if (!/static\s+create\s*\(/.test(content)) {
          violations.push(
            `${relativeTo(file)} missing static create() method`,
          );
        }
      }

      expect(violations).toEqual([]);
    });

    it('all *.entity.ts files should have an id property (own or inherited)', () => {
      const entityFiles = findFiles(SRC_DIR, /\.entity\.ts$/, SPEC_PATTERN);
      const domainEntities = entityFiles.filter(
        (f) => !f.includes('base.entity.ts'),
      );
      const violations: string[] = [];

      for (const file of domainEntities) {
        const content = fs.readFileSync(file, 'utf-8');
        const hasOwnId = /(?:readonly\s+)?id\s*[:\s]/.test(content);
        const extendsBase = /extends\s+BaseEntity/.test(content);

        if (!hasOwnId && !extendsBase) {
          violations.push(
            `${relativeTo(file)} has no id property and does not extend BaseEntity`,
          );
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe('Repository rehydration pattern', () => {
    function extractMethodBody(content: string, methodName: string): string | null {
      const methodPattern = new RegExp(`${methodName}\\s*\\([^)]*\\)[^{]*\\{`);
      const match = methodPattern.exec(content);
      if (!match) return null;

      let depth = 1;
      const start = match.index + match[0].length;
      for (let i = start; i < content.length; i++) {
        if (content[i] === '{') depth++;
        if (content[i] === '}') depth--;
        if (depth === 0) return content.slice(start, i);
      }
      return null;
    }

    function getEntityClassNames(ctx: string): string[] {
      const entityDir = path.join(SRC_DIR, ctx, 'domain', 'entities');
      const entityFiles = findFiles(entityDir, /\.entity\.ts$/, SPEC_PATTERN);
      return entityFiles
        .map((f) => {
          const content = fs.readFileSync(f, 'utf-8');
          const classMatch = content.match(/export\s+class\s+(\w+)/);
          return classMatch ? classMatch[1] : null;
        })
        .filter(Boolean) as string[];
    }

    it('toDomain() methods must use reconstitute(), not create()', () => {
      const violations: string[] = [];

      for (const ctx of BOUNDED_CONTEXTS) {
        const persistenceDir = path.join(
          SRC_DIR,
          ctx,
          'infrastructure',
          'persistence',
        );
        const repoFiles = findFiles(
          persistenceDir,
          /mikro-orm-.*\.repository\.ts$/,
        );
        const entityNames = getEntityClassNames(ctx);

        for (const file of repoFiles) {
          const content = fs.readFileSync(file, 'utf-8');
          const toDomainBody = extractMethodBody(content, 'toDomain');
          if (!toDomainBody) continue;

          for (const entityName of entityNames) {
            const createCallPattern = new RegExp(
              `${entityName}\\.create\\s*\\(`,
            );
            if (createCallPattern.test(toDomainBody)) {
              violations.push(
                `${relativeTo(file)} toDomain() calls ${entityName}.create() — use ${entityName}.reconstitute() instead`,
              );
            }
          }
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe('Value Object structure', () => {
    it('all *.vo.ts files should extend ValueObject or have readonly properties', () => {
      const voFiles = findFiles(SRC_DIR, /\.vo\.ts$/, SPEC_PATTERN);
      const violations: string[] = [];

      for (const file of voFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const extendsVO = /extends\s+ValueObject/.test(content);
        const hasReadonly = /readonly\s+\w+/.test(content);
        const hasFrozen = /Object\.freeze/.test(content);
        const isEnum = /export\s+enum\s+/.test(content);

        if (!extendsVO && !hasReadonly && !hasFrozen && !isEnum) {
          violations.push(
            `${relativeTo(file)} does not extend ValueObject nor have readonly/frozen properties`,
          );
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe('Repository interfaces in domain only', () => {
    it('all *.repository.ts files must be inside domain/repositories/', () => {
      const repoFiles = findFiles(SRC_DIR, /\.repository\.ts$/, SPEC_PATTERN);
      const violations: string[] = [];

      for (const file of repoFiles) {
        const rel = relativeTo(file);
        // Interfaces must be in domain/repositories/
        // Implementations (mikro-orm-*) are in infrastructure/persistence/ — that's OK
        const isImplementation = rel.includes('/infrastructure/persistence/');
        const inDomainRepos =
          rel.includes('/domain/repositories/') ||
          (rel.includes('/domain/') && rel.startsWith('shared/'));

        if (!inDomainRepos && !isImplementation) {
          violations.push(
            `${rel} is a repository interface outside domain/repositories/`,
          );
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe('Controller layer restrictions', () => {
    // Controllers that still embed domain logic — tracked here so new violations fail immediately.
    // Each entry is removed when the corresponding handler extraction is done.
    const KNOWN_CONTROLLER_VIOLATIONS: Record<string, string[]> = {
      'contabilidad/infrastructure/controllers/contabilidad.controller.ts': [
        'domain/entities/libro-contable.entity',
        'domain/entities/asiento-contable.entity',
      ],
      'documentos/infrastructure/controllers/documentos.controller.ts': [
        'domain/entities/documento.entity',
      ],
      'estudio/infrastructure/controllers/estudio.controller.ts': [
        'domain/value-objects/nombre-estudio.vo',
      ],
      'facturacion/infrastructure/controllers/facturacion.controller.ts': [
        'domain/entities/pago.entity',
      ],
      'nomina/infrastructure/controllers/nomina.controller.ts': [
        'domain/entities/empleado.entity',
      ],
    };

    function isViolatingImport(imp: string): boolean {
      if (/domain\/(entities|value-objects|events)\//.test(imp)) return true;
      if (imp.includes('shared/domain/event-bus')) return true;
      return false;
    }

    function isKnownViolation(controllerRel: string, imp: string): boolean {
      const known = KNOWN_CONTROLLER_VIOLATIONS[controllerRel];
      if (!known) return false;
      return known.some((pattern) => imp.includes(pattern));
    }

    it('controllers must not import domain entities or event bus (new violations)', () => {
      const violations: string[] = [];

      for (const ctx of BOUNDED_CONTEXTS) {
        const controllersDir = path.join(SRC_DIR, ctx, 'infrastructure', 'controllers');
        const controllerFiles = findFiles(controllersDir, /\.controller\.ts$/, SPEC_PATTERN);

        for (const file of controllerFiles) {
          const rel = relativeTo(file);
          const imports = extractImports(file);

          for (const imp of imports) {
            if (!isViolatingImport(imp)) continue;
            if (isKnownViolation(rel, imp)) continue;

            violations.push(`${rel} imports "${imp}" — domain entities/events/event-bus are forbidden in controllers`);
          }
        }
      }

      expect(violations).toEqual([]);
    });

    it('known violations list stays in sync (remove entries when controllers are cleaned up)', () => {
      const staleEntries: string[] = [];

      for (const [controllerRel, patterns] of Object.entries(KNOWN_CONTROLLER_VIOLATIONS)) {
        const filePath = path.join(SRC_DIR, controllerRel);
        if (!fs.existsSync(filePath)) {
          staleEntries.push(`${controllerRel} — file no longer exists`);
          continue;
        }

        const imports = extractImports(filePath);
        for (const pattern of patterns) {
          const stillPresent = imports.some((imp) => imp.includes(pattern));
          if (!stillPresent) {
            staleEntries.push(`${controllerRel} no longer imports "${pattern}" — remove from KNOWN_CONTROLLER_VIOLATIONS`);
          }
        }
      }

      expect(staleEntries).toEqual([]);
    });
  });

  describe('Read-model context restrictions', () => {
    function resolveImportContext(file: string, imp: string): string | null {
      if (!imp.startsWith('.') && !imp.startsWith('/')) return null;
      if (imp.includes('/shared/')) return null;
      if (imp.startsWith('@numerito/shared')) return null;

      const resolvedDir = path.dirname(
        path.resolve(path.dirname(file), imp),
      );
      const relFromSrc = path.relative(SRC_DIR, resolvedDir).replace(/\\/g, '/');

      for (const ctx of BOUNDED_CONTEXTS) {
        if (relFromSrc === ctx || relFromSrc.startsWith(`${ctx}/`)) {
          return ctx;
        }
      }
      return null;
    }

    it('read-model contexts must not import from domain layer of other contexts', () => {
      const violations: string[] = [];
      const forbiddenDomainPaths = [
        '/domain/entities/',
        '/domain/value-objects/',
        '/domain/events/',
      ];

      for (const ctx of READ_MODEL_CONTEXTS) {
        const ctxDir = path.join(SRC_DIR, ctx);
        const files = findFiles(ctxDir, /\.ts$/, SPEC_PATTERN);

        for (const file of files) {
          const imports = extractImports(file);
          for (const imp of imports) {
            const targetCtx = resolveImportContext(file, imp);
            if (!targetCtx) continue;

            for (const forbidden of forbiddenDomainPaths) {
              if (imp.includes(forbidden)) {
                violations.push(
                  `${relativeTo(file)} imports from "${targetCtx}"${forbidden} via "${imp}" — read-model contexts must compose public views or use raw SQL instead`,
                );
              }
            }
          }
        }
      }

      expect(violations).toEqual([]);
    });

    it('read-model contexts must not import application services, commands, or queries from other contexts', () => {
      const violations: string[] = [];
      const forbiddenAppLayers = [
        '/application/commands/',
        '/application/queries/',
        '/application/services/',
      ];

      for (const ctx of READ_MODEL_CONTEXTS) {
        const ctxDir = path.join(SRC_DIR, ctx);
        const files = findFiles(ctxDir, /\.ts$/, SPEC_PATTERN);

        for (const file of files) {
          const imports = extractImports(file);
          for (const imp of imports) {
            const targetCtx = resolveImportContext(file, imp);
            if (!targetCtx) continue;

            for (const forbidden of forbiddenAppLayers) {
              if (imp.includes(forbidden)) {
                violations.push(
                  `${relativeTo(file)} imports from "${targetCtx}"${forbidden} via "${imp}" — read-model contexts may only import public-events from other contexts' application layer`,
                );
              }
            }
          }
        }
      }

      expect(violations).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // TenantBoundary — Phase 1 (non-blocking)
  //
  // These tests report violations as warnings. They become blocking assertions
  // in Phase 3 (#231) once every context has migrated to EstudioPrincipal.
  //
  // See ADR 0002 for the full rationale and migration plan.
  // ---------------------------------------------------------------------------
  describe('TenantBoundary (Phase 1 — non-blocking)', () => {
    function readFileContent(filePath: string): string {
      return fs.readFileSync(filePath, 'utf-8');
    }

    it('(advisory) tenant-aware repository methods should accept EstudioPrincipal as first parameter', () => {
      const warnings: string[] = [];

      for (const ctx of BOUNDED_CONTEXTS) {
        const persistenceDir = path.join(SRC_DIR, ctx, 'infrastructure', 'persistence');
        const repoFiles = findFiles(persistenceDir, /mikro-orm-.*\.repository\.ts$/);

        for (const file of repoFiles) {
          const content = readFileContent(file);
          if (!content.includes('TenantAwareRepository')) continue;

          // Extract public method signatures (async methodName(...))
          const methodPattern = /async\s+(\w+)\s*\(([^)]*)\)/g;
          let match: RegExpExecArray | null;
          while ((match = methodPattern.exec(content)) !== null) {
            const methodName = match[1];
            const params = match[2].trim();

            // Skip private/internal methods
            if (methodName.startsWith('_')) continue;

            // Check if first parameter is typed as EstudioPrincipal
            if (!params.startsWith('principal') && !params.includes('EstudioPrincipal')) {
              warnings.push(
                `${relativeTo(file)} → ${methodName}() missing EstudioPrincipal as first parameter`,
              );
            }
          }
        }
      }

      if (warnings.length > 0) {
        // Non-blocking: log warnings but do not fail.
        // Becomes expect(warnings).toEqual([]) in Phase 3 (#231).
        console.warn(
          `[TenantBoundary] ${warnings.length} repository method(s) missing EstudioPrincipal parameter (non-blocking):\n` +
            warnings.map((w) => `  - ${w}`).join('\n'),
        );
      }

      // Intentionally no assertion — this is advisory in Phase 1.
      // Phase 3 (#231) will flip to: expect(warnings).toEqual([]);
    });

    it('(advisory) application-layer code should not call getTenantId() directly', () => {
      const warnings: string[] = [];

      for (const ctx of BOUNDED_CONTEXTS) {
        const appDir = path.join(SRC_DIR, ctx, 'application');
        const files = findFiles(appDir, /\.ts$/, SPEC_PATTERN);

        for (const file of files) {
          const content = readFileContent(file);
          if (content.includes('getTenantId(')) {
            warnings.push(
              `${relativeTo(file)} calls getTenantId() — should receive EstudioPrincipal instead`,
            );
          }
        }
      }

      if (warnings.length > 0) {
        console.warn(
          `[TenantBoundary] ${warnings.length} application file(s) call getTenantId() directly (non-blocking):\n` +
            warnings.map((w) => `  - ${w}`).join('\n'),
        );
      }

      // Intentionally no assertion — this is advisory in Phase 1.
      // Phase 3 (#231) will flip to: expect(warnings).toEqual([]);
    });

    it('(advisory) application-layer code should not read RequestContextService.estudioId directly', () => {
      const warnings: string[] = [];

      for (const ctx of BOUNDED_CONTEXTS) {
        const appDir = path.join(SRC_DIR, ctx, 'application');
        const files = findFiles(appDir, /\.ts$/, SPEC_PATTERN);

        for (const file of files) {
          const content = readFileContent(file);
          if (
            content.includes('RequestContextService') &&
            content.includes('.estudioId')
          ) {
            warnings.push(
              `${relativeTo(file)} reads RequestContextService.estudioId — should receive EstudioPrincipal instead`,
            );
          }
        }
      }

      if (warnings.length > 0) {
        console.warn(
          `[TenantBoundary] ${warnings.length} application file(s) read RequestContextService.estudioId directly (non-blocking):\n` +
            warnings.map((w) => `  - ${w}`).join('\n'),
        );
      }

      // Intentionally no assertion — this is advisory in Phase 1.
      // Phase 3 (#231) will flip to: expect(warnings).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // ReadModelViewContract — blocking
  //
  // Read-model contexts (dashboard, portal, administracion) must compose
  // public views instead of importing source-context schemas directly.
  // Flipped from advisory to blocking in #232.
  //
  // See ADR 0003 for the full rationale and migration plan.
  // ---------------------------------------------------------------------------
  describe('ReadModelViewContract', () => {
    function resolveImportContext(file: string, imp: string): string | null {
      if (!imp.startsWith('.') && !imp.startsWith('/')) return null;
      if (imp.includes('/shared/')) return null;
      if (imp.startsWith('@numerito/shared')) return null;

      const resolvedDir = path.dirname(
        path.resolve(path.dirname(file), imp),
      );
      const relFromSrc = path.relative(SRC_DIR, resolvedDir).replace(/\\/g, '/');

      for (const ctx of BOUNDED_CONTEXTS) {
        if (relFromSrc === ctx || relFromSrc.startsWith(`${ctx}/`)) {
          return ctx;
        }
      }
      return null;
    }

    it('read-model contexts must not import schema entities from other contexts', () => {
      const violations: string[] = [];

      for (const ctx of READ_MODEL_CONTEXTS) {
        const ctxDir = path.join(SRC_DIR, ctx);
        const files = findFiles(ctxDir, /\.ts$/, SPEC_PATTERN);

        for (const file of files) {
          const imports = extractImports(file);
          for (const imp of imports) {
            const targetCtx = resolveImportContext(file, imp);
            if (!targetCtx) continue;

            if (imp.includes('/infrastructure/persistence/') && imp.includes('.schema')) {
              violations.push(
                `${relativeTo(file)} imports schema from "${targetCtx}" via "${imp}" — must use a public view instead`,
              );
            }
          }
        }
      }

      expect(violations).toEqual([]);
    });

    it('public views must be exported from public-views.ts', () => {
      const violations: string[] = [];

      for (const ctx of BOUNDED_CONTEXTS) {
        const viewsDir = path.join(SRC_DIR, ctx, 'application', 'views');
        const viewFiles = findFiles(viewsDir, /\.view\.ts$/, SPEC_PATTERN);
        if (viewFiles.length === 0) continue;

        const barrelPath = path.join(SRC_DIR, ctx, 'application', 'public-views.ts');
        if (!fs.existsSync(barrelPath)) {
          violations.push(
            `${ctx} has views in application/views/ but no public-views.ts barrel`,
          );
          continue;
        }

        const barrelContent = fs.readFileSync(barrelPath, 'utf-8');
        for (const viewFile of viewFiles) {
          const fileName = path.basename(viewFile, '.ts');
          // Check that the barrel references the view file
          if (!barrelContent.includes(fileName)) {
            violations.push(
              `${relativeTo(viewFile)} is not exported from ${ctx}/application/public-views.ts`,
            );
          }
        }
      }

      expect(violations).toEqual([]);
    });
  });
});
