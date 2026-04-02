import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.resolve(__dirname, '../..');

const BOUNDED_CONTEXTS = [
  'iam',
  'tenant',
  'clientes',
  'contabilidad',
  'nomina',
  'documentos',
  'integraciones',
  'obligaciones',
  'tareas',
  'facturacion',
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

          // MikroORM schema files are allowed to cross-import for FK relationships
          if (rel.includes('/infrastructure/persistence/') && rel.endsWith('.schema.ts')) continue;

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
        // Allow shared/domain/ as well
        const inDomainRepos =
          rel.includes('/domain/repositories/') ||
          rel.includes('/domain/') && rel.startsWith('shared/');

        if (!inDomainRepos) {
          violations.push(
            `${rel} is a repository interface outside domain/repositories/`,
          );
        }
      }

      expect(violations).toEqual([]);
    });
  });
});
