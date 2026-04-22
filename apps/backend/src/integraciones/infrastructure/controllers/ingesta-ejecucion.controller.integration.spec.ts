import * as http from 'http';
import { Test } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { IngestaEjecucionController } from './ingesta-ejecucion.controller';
import { ProcesarResultadoScrapingHandler } from '../../application/commands/procesar-resultado-scraping.command';
import { EjecutarIngestaManualHandler } from '../../application/commands/ejecutar-ingesta-manual.command';
import { EjecucionIngestaListHandler } from '../../application/queries/ejecucion-ingesta-list.query';
import { SUGERENCIAS_PRORROGA_DETECTOR } from '../../domain/ports/sugerencias-prorroga-detector.port';
import { FARGATE_TASK_LAUNCHER } from '../../domain/ports/fargate-task-launcher.port';
import { EJECUCION_INGESTA_REPOSITORY } from '../../domain/repositories/ejecucion-ingesta.repository';
import { IngestaWebhookGuard } from '../guards/ingesta-webhook.guard';
import { AdminOrIngestaGuard } from '../guards/admin-or-ingesta.guard';
import { AdminGuard } from '../../../shared/infrastructure/guards/admin.guard';
import { JwtAuthGuard } from '../../../shared/infrastructure/guards/jwt-auth.guard';
import type { ResultadoScrapingDto } from '../../application/dtos/resultado-scraping.dto';

const TEST_JWT_SECRET = 'test-jwt-secret-integration';
const TEST_INGESTA_SECRET = 'test-ingesta-secret-42';

// ── Fixtures: valid payloads per fuente ──────────────────────────────────────

function makeResultadoDto(
  fuente: ResultadoScrapingDto['fuente'],
  overrides: Partial<ResultadoScrapingDto> = {},
): ResultadoScrapingDto {
  const base: ResultadoScrapingDto = {
    fuente,
    ejecutadoEn: '2026-04-22T12:00:00Z',
    reglas:
      fuente === 'BCRA_FERIADOS'
        ? []
        : [
            {
              tipoObligacion: fuente === 'ARCA' ? 'IVA' : fuente === 'ARBA' ? 'IIBB' : 'ISIB',
              jurisdiccion: fuente,
              regimen: 'GENERAL',
              terminacionCuit: '0',
              diaVencimiento: 22,
              mesSiguiente: true,
              vigenciaDesde: '2026-01-01',
            },
          ],
    feriados:
      fuente === 'BCRA_FERIADOS'
        ? [
            {
              fecha: '2026-05-25',
              tipo: 'NACIONAL',
              descripcion: 'Día de la Revolución de Mayo',
            },
          ]
        : [],
    errores: [],
    ...overrides,
  };
  return base;
}

function makeHandlerResult(overrides: Record<string, unknown> = {}) {
  return {
    ejecucionId: 'ej-integration-1',
    reglasNuevas: 1,
    reglasModificadas: 0,
    sinCambios: 0,
    feriadosNuevos: 0,
    feriadosExistentes: 0,
    errores: [],
    diff: [],
    diffFeriados: [],
    ...overrides,
  };
}

// ── Request helper (reused from tenant-context-boundary pattern) ─────────────

class RequestHelper {
  private headers: Record<string, string> = {};
  private bodyData: string | undefined;

  constructor(
    private readonly server: http.Server,
    private readonly method: string,
    private readonly path: string,
  ) {}

  header(key: string, value: string): this {
    this.headers[key] = value;
    return this;
  }

  body(data: unknown): this {
    this.bodyData = JSON.stringify(data);
    return this;
  }

  async send(): Promise<{ status: number; body: any }> {
    const addr = this.server.address() as { port: number };
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: 'localhost',
          port: addr.port,
          path: this.path,
          method: this.method,
          headers: {
            'Content-Type': 'application/json',
            ...this.headers,
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk: string) => (data += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode!, body: JSON.parse(data || '{}') });
            } catch {
              resolve({ status: res.statusCode!, body: data });
            }
          });
        },
      );

      req.on('error', reject);
      if (this.bodyData) {
        req.write(this.bodyData);
      }
      req.end();
    });
  }
}

// ── Test suite ───────────────────────────────────────────────────────────────

describe('IngestaEjecucionController (integration)', () => {
  let app: INestApplication;
  let server: http.Server;
  let jwtService: JwtService;
  let procesarHandler: { execute: jest.Mock };
  let sugerenciasDetector: { detectar: jest.Mock };

  function request(method: 'GET' | 'POST', path: string) {
    return new RequestHelper(server, method, path);
  }

  function signAdminToken(): string {
    return jwtService.sign(
      { sub: 'admin-user-1', email: 'admin@test.com', rol: 'SUPERADMIN' },
      { secret: TEST_JWT_SECRET },
    );
  }

  function signNonAdminToken(): string {
    return jwtService.sign(
      { sub: 'user-2', email: 'socio@test.com', rol: 'SOCIO' },
      { secret: TEST_JWT_SECRET },
    );
  }

  /** POST to the resultado endpoint for a given fuente */
  function resultadoUrl(fuente: string): string {
    return `/v1/admin/ingesta/${fuente}/resultado`;
  }

  beforeAll(async () => {
    procesarHandler = { execute: jest.fn().mockResolvedValue(makeHandlerResult()) };
    sugerenciasDetector = {
      detectar: jest.fn().mockResolvedValue({ sugerenciasCreadas: 0, sugerenciasOmitidas: 0 }),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [IngestaEjecucionController],
      providers: [
        JwtService,
        Reflector,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'JWT_SECRET') return TEST_JWT_SECRET;
              if (key === 'INGESTA_SECRET') return TEST_INGESTA_SECRET;
              return undefined;
            },
          },
        },
        JwtAuthGuard,
        AdminGuard,
        IngestaWebhookGuard,
        AdminOrIngestaGuard,
        { provide: ProcesarResultadoScrapingHandler, useValue: procesarHandler },
        { provide: SUGERENCIAS_PRORROGA_DETECTOR, useValue: sugerenciasDetector },
        {
          provide: EjecutarIngestaManualHandler,
          useValue: { execute: jest.fn().mockResolvedValue({ mode: 'async' }) },
        },
        {
          provide: EjecucionIngestaListHandler,
          useValue: { execute: jest.fn().mockResolvedValue([]), byId: jest.fn() },
        },
        { provide: EJECUCION_INGESTA_REPOSITORY, useValue: { findById: jest.fn() } },
        { provide: FARGATE_TASK_LAUNCHER, useValue: null },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI });
    await app.init();
    jwtService = moduleRef.get(JwtService);
    server = app.getHttpServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    procesarHandler.execute.mockResolvedValue(makeHandlerResult());
  });

  // ── Auth tests ───────────────────────────────────────────────────────────

  describe('Auth: POST /:fuente/resultado', () => {
    const dto = makeResultadoDto('ARCA');

    it('should reject request without auth headers or JWT (401)', async () => {
      const res = await request('POST', resultadoUrl('ARCA')).body(dto).send();
      expect(res.status).toBe(401);
    });

    it('should reject request with invalid x-ingesta-secret (401)', async () => {
      const res = await request('POST', resultadoUrl('ARCA'))
        .header('x-ingesta-secret', 'wrong-secret')
        .body(dto)
        .send();
      expect(res.status).toBe(401);
    });

    it('should reject request with non-admin JWT (403)', async () => {
      const res = await request('POST', resultadoUrl('ARCA'))
        .header('Authorization', `Bearer ${signNonAdminToken()}`)
        .body(dto)
        .send();
      expect(res.status).toBe(403);
    });

    it('should accept request with valid x-ingesta-secret (200)', async () => {
      const res = await request('POST', resultadoUrl('ARCA'))
        .header('x-ingesta-secret', TEST_INGESTA_SECRET)
        .body(dto)
        .send();
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.ejecucionId).toBe('ej-integration-1');
    });

    it('should accept request with valid admin JWT (200)', async () => {
      const res = await request('POST', resultadoUrl('ARCA'))
        .header('Authorization', `Bearer ${signAdminToken()}`)
        .body(dto)
        .send();
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it('should set disparador=SCHEDULE when x-ingesta-secret is used', async () => {
      await request('POST', resultadoUrl('ARCA'))
        .header('x-ingesta-secret', TEST_INGESTA_SECRET)
        .body(dto)
        .send();

      expect(procesarHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          disparador: 'SCHEDULE',
          disparadoPor: null,
        }),
      );
    });

    it('should set disparador=MANUAL and disparadoPor when admin JWT is used', async () => {
      await request('POST', resultadoUrl('ARCA'))
        .header('Authorization', `Bearer ${signAdminToken()}`)
        .body(dto)
        .send();

      expect(procesarHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          disparador: 'MANUAL',
          disparadoPor: 'admin-user-1',
        }),
      );
    });
  });

  // ── Happy path per fuente ────────────────────────────────────────────────

  describe('Happy path: valid payload per fuente', () => {
    const fuentes = ['ARCA', 'ARBA', 'AGIP', 'BCRA_FERIADOS'] as const;

    for (const fuente of fuentes) {
      it(`should accept valid payload for ${fuente} and return 200 with result`, async () => {
        const dto = makeResultadoDto(fuente);
        procesarHandler.execute.mockResolvedValue(
          makeHandlerResult({
            ejecucionId: `ej-${fuente.toLowerCase()}-1`,
            reglasNuevas: fuente === 'BCRA_FERIADOS' ? 0 : 1,
            feriadosNuevos: fuente === 'BCRA_FERIADOS' ? 1 : 0,
          }),
        );

        const res = await request('POST', resultadoUrl(fuente))
          .header('x-ingesta-secret', TEST_INGESTA_SECRET)
          .body(dto)
          .send();

        expect(res.status).toBe(200);
        expect(res.body.data.ejecucionId).toBe(`ej-${fuente.toLowerCase()}-1`);

        // Verify the handler received the correct fuente from the URL param
        expect(procesarHandler.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            resultado: expect.objectContaining({ fuente }),
          }),
        );
      });
    }

    it('should pass reglas array from body to handler', async () => {
      const dto = makeResultadoDto('ARCA', {
        reglas: [
          {
            tipoObligacion: 'IVA',
            jurisdiccion: 'ARCA',
            regimen: 'GENERAL',
            terminacionCuit: '0',
            diaVencimiento: 22,
            mesSiguiente: true,
            vigenciaDesde: '2026-01-01',
          },
          {
            tipoObligacion: 'SICOSS',
            jurisdiccion: 'ARCA',
            regimen: 'GENERAL',
            terminacionCuit: '1',
            diaVencimiento: 15,
            mesSiguiente: false,
            vigenciaDesde: '2026-01-01',
          },
        ],
      });

      await request('POST', resultadoUrl('ARCA'))
        .header('x-ingesta-secret', TEST_INGESTA_SECRET)
        .body(dto)
        .send();

      const call = procesarHandler.execute.mock.calls[0][0];
      expect(call.resultado.reglas).toHaveLength(2);
      expect(call.resultado.reglas[0].tipoObligacion).toBe('IVA');
      expect(call.resultado.reglas[1].tipoObligacion).toBe('SICOSS');
    });

    it('should pass feriados array from body to handler (BCRA_FERIADOS)', async () => {
      const dto = makeResultadoDto('BCRA_FERIADOS', {
        feriados: [
          { fecha: '2026-05-25', tipo: 'NACIONAL', descripcion: 'Revolución de Mayo' },
          { fecha: '2026-06-20', tipo: 'NACIONAL', descripcion: 'Día de la Bandera' },
        ],
      });

      await request('POST', resultadoUrl('BCRA_FERIADOS'))
        .header('x-ingesta-secret', TEST_INGESTA_SECRET)
        .body(dto)
        .send();

      const call = procesarHandler.execute.mock.calls[0][0];
      expect(call.resultado.feriados).toHaveLength(2);
      expect(call.resultado.feriados[0].fecha).toBe('2026-05-25');
    });

    it('should include sugerenciasCreadas when handler reports modified rules', async () => {
      procesarHandler.execute.mockResolvedValue(
        makeHandlerResult({
          reglasModificadas: 3,
          diff: [
            { reglaId: 'r1', tipo: 'MODIFICADA', campo: 'diaVencimiento', antes: 20, despues: 22 },
          ],
        }),
      );
      sugerenciasDetector.detectar.mockResolvedValue({
        sugerenciasCreadas: 2,
        sugerenciasOmitidas: 1,
      });

      const res = await request('POST', resultadoUrl('ARCA'))
        .header('x-ingesta-secret', TEST_INGESTA_SECRET)
        .body(makeResultadoDto('ARCA'))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.data.sugerenciasCreadas).toBe(2);
      expect(res.body.data.sugerenciasOmitidas).toBe(1);
    });

    it('should not fail if sugerencias detection throws (best-effort)', async () => {
      procesarHandler.execute.mockResolvedValue(
        makeHandlerResult({
          reglasModificadas: 1,
          diff: [{ reglaId: 'r1', tipo: 'MODIFICADA' }],
        }),
      );
      sugerenciasDetector.detectar.mockRejectedValue(new Error('detection failed'));

      const res = await request('POST', resultadoUrl('ARCA'))
        .header('x-ingesta-secret', TEST_INGESTA_SECRET)
        .body(makeResultadoDto('ARCA'))
        .send();

      // Should still return 200 — sugerencias are best-effort
      expect(res.status).toBe(200);
      expect(res.body.data.ejecucionId).toBeDefined();
    });
  });

  // ── Idempotency ──────────────────────────────────────────────────────────

  describe('Idempotency: same ingestaId twice', () => {
    it('should return duplicado=true on second call with same ingestaId', async () => {
      const dto = makeResultadoDto('ARCA', { ingestaId: 'idempotent-key-123' });

      // First call: normal result
      procesarHandler.execute.mockResolvedValueOnce(
        makeHandlerResult({ ejecucionId: 'ej-first', reglasNuevas: 5 }),
      );

      const res1 = await request('POST', resultadoUrl('ARCA'))
        .header('x-ingesta-secret', TEST_INGESTA_SECRET)
        .body(dto)
        .send();
      expect(res1.status).toBe(200);
      expect(res1.body.data.ejecucionId).toBe('ej-first');

      // Second call: handler returns duplicado=true (handler detects via ingestaId)
      procesarHandler.execute.mockResolvedValueOnce(
        makeHandlerResult({ ejecucionId: 'ej-first', duplicado: true, reglasNuevas: 5 }),
      );

      const res2 = await request('POST', resultadoUrl('ARCA'))
        .header('x-ingesta-secret', TEST_INGESTA_SECRET)
        .body(dto)
        .send();
      expect(res2.status).toBe(200);
      expect(res2.body.data.duplicado).toBe(true);
      expect(res2.body.data.ejecucionId).toBe('ej-first');
    });

    it('should pass ingestaId through to handler', async () => {
      const dto = makeResultadoDto('ARBA', { ingestaId: 'my-ingesta-id' });

      await request('POST', resultadoUrl('ARBA'))
        .header('x-ingesta-secret', TEST_INGESTA_SECRET)
        .body(dto)
        .send();

      expect(procesarHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          resultado: expect.objectContaining({ ingestaId: 'my-ingesta-id' }),
        }),
      );
    });

    it('should pass ejecucionId through to handler for pre-created executions', async () => {
      const dto = makeResultadoDto('AGIP', { ejecucionId: 'pre-created-ej-1' });

      await request('POST', resultadoUrl('AGIP'))
        .header('x-ingesta-secret', TEST_INGESTA_SECRET)
        .body(dto)
        .send();

      expect(procesarHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          resultado: expect.objectContaining({ ejecucionId: 'pre-created-ej-1' }),
        }),
      );
    });
  });

  // ── Validation ───────────────────────────────────────────────────────────

  describe('Validation: bad body → 400', () => {
    it('should reject empty body (400)', async () => {
      const res = await request('POST', resultadoUrl('ARCA'))
        .header('x-ingesta-secret', TEST_INGESTA_SECRET)
        .body({})
        .send();

      expect(res.status).toBe(400);
    });

    it('should reject body missing required field ejecutadoEn (400)', async () => {
      const res = await request('POST', resultadoUrl('ARCA'))
        .header('x-ingesta-secret', TEST_INGESTA_SECRET)
        .body({ fuente: 'ARCA' })
        .send();

      expect(res.status).toBe(400);
    });

    it('should reject body with invalid fuente enum value (400)', async () => {
      const res = await request('POST', resultadoUrl('ARCA'))
        .header('x-ingesta-secret', TEST_INGESTA_SECRET)
        .body({ fuente: 'INVALID_FUENTE', ejecutadoEn: '2026-04-22T12:00:00Z' })
        .send();

      expect(res.status).toBe(400);
    });

    it('should reject regla with diaVencimiento > 31 (400)', async () => {
      const res = await request('POST', resultadoUrl('ARCA'))
        .header('x-ingesta-secret', TEST_INGESTA_SECRET)
        .body({
          fuente: 'ARCA',
          ejecutadoEn: '2026-04-22T12:00:00Z',
          reglas: [
            {
              tipoObligacion: 'IVA',
              jurisdiccion: 'ARCA',
              regimen: 'GENERAL',
              terminacionCuit: '0',
              diaVencimiento: 32, // invalid: max 31
              mesSiguiente: true,
              vigenciaDesde: '2026-01-01',
            },
          ],
        })
        .send();

      expect(res.status).toBe(400);
    });

    it('should reject regla with terminacionCuit longer than 1 char (400)', async () => {
      const res = await request('POST', resultadoUrl('ARCA'))
        .header('x-ingesta-secret', TEST_INGESTA_SECRET)
        .body({
          fuente: 'ARCA',
          ejecutadoEn: '2026-04-22T12:00:00Z',
          reglas: [
            {
              tipoObligacion: 'IVA',
              jurisdiccion: 'ARCA',
              regimen: 'GENERAL',
              terminacionCuit: '01', // invalid: must be exactly 1 char
              diaVencimiento: 22,
              mesSiguiente: true,
              vigenciaDesde: '2026-01-01',
            },
          ],
        })
        .send();

      expect(res.status).toBe(400);
    });

    it('should reject feriado with invalid tipo enum (400)', async () => {
      const res = await request('POST', resultadoUrl('BCRA_FERIADOS'))
        .header('x-ingesta-secret', TEST_INGESTA_SECRET)
        .body({
          fuente: 'BCRA_FERIADOS',
          ejecutadoEn: '2026-04-22T12:00:00Z',
          feriados: [
            {
              fecha: '2026-05-25',
              tipo: 'INVALID_TIPO', // invalid enum
              descripcion: 'Test',
            },
          ],
        })
        .send();

      expect(res.status).toBe(400);
    });

    it('should include field-level error details in 400 response', async () => {
      const res = await request('POST', resultadoUrl('ARCA'))
        .header('x-ingesta-secret', TEST_INGESTA_SECRET)
        .body({})
        .send();

      expect(res.status).toBe(400);
      // NestJS wraps BadRequestException: { statusCode, message, error? }
      // The ZodValidationPipe throws BadRequestException({ message, errors })
      expect(res.body.message).toBeDefined();
    });

    it('should accept minimal valid body (fuente + ejecutadoEn, defaults for arrays)', async () => {
      const res = await request('POST', resultadoUrl('ARCA'))
        .header('x-ingesta-secret', TEST_INGESTA_SECRET)
        .body({ fuente: 'ARCA', ejecutadoEn: '2026-04-22T12:00:00Z' })
        .send();

      expect(res.status).toBe(200);

      // Arrays should default to []
      const call = procesarHandler.execute.mock.calls[0][0];
      expect(call.resultado.reglas).toEqual([]);
      expect(call.resultado.feriados).toEqual([]);
      expect(call.resultado.errores).toEqual([]);
    });
  });

  // ── Handler error propagation ────────────────────────────────────────────

  describe('Handler errors', () => {
    it('should return 500 when handler throws unexpected error', async () => {
      procesarHandler.execute.mockRejectedValue(new Error('unexpected DB failure'));

      const res = await request('POST', resultadoUrl('ARCA'))
        .header('x-ingesta-secret', TEST_INGESTA_SECRET)
        .body(makeResultadoDto('ARCA'))
        .send();

      expect(res.status).toBe(500);
    });
  });

  // ── URL fuente parameter override ────────────────────────────────────────

  describe('URL fuente parameter', () => {
    it('should use fuente from URL param, overriding body fuente', async () => {
      // Body says ARBA but URL says ARCA — controller uses URL param
      const dto = makeResultadoDto('ARBA');

      await request('POST', resultadoUrl('ARCA'))
        .header('x-ingesta-secret', TEST_INGESTA_SECRET)
        .body(dto)
        .send();

      expect(procesarHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          resultado: expect.objectContaining({ fuente: 'ARCA' }),
        }),
      );
    });
  });
});
