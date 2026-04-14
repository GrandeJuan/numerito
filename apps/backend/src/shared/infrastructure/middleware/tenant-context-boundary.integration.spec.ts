import * as http from 'http';
import { Test } from '@nestjs/testing';
import {
  Controller,
  Get,
  INestApplication,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { RequestContextModule } from '../request-context.module';
import {
  RequestContextService,
  REQUEST_CONTEXT,
} from '../services/request-context.service';
import { EstudioId } from '../decorators/estudio-id.decorator';
import { JwtAuthGuard } from '../../../iam/infrastructure/guards/jwt-auth.guard';
import { EstudioMemberGuard } from '../../../iam/infrastructure/guards/estudio-member.guard';
import { Public } from '../../../iam/infrastructure/decorators/public.decorator';
import {
  ESTUDIO_ID_HEADER,
  CORRELATION_ID_HEADER,
} from './request-context.middleware';

const TEST_JWT_SECRET = 'test-secret-for-integration';

@Controller('test')
class TestController {
  constructor(
    @Inject(REQUEST_CONTEXT)
    private readonly context: RequestContextService,
  ) {}

  @Public()
  @Get('public')
  publicRoute(@EstudioId() estudioId: string | undefined) {
    return {
      estudioId,
      contextEstudioId: this.context.estudioId,
      correlationId: this.context.correlationId,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('auth-only')
  authOnlyRoute(@EstudioId() estudioId: string | undefined) {
    return {
      estudioId,
      contextEstudioId: this.context.estudioId,
      userId: this.context.userId,
    };
  }

  @UseGuards(EstudioMemberGuard)
  @Get('tenant-required')
  tenantRequiredRoute(@EstudioId() estudioId: string | undefined) {
    return {
      estudioId,
      contextEstudioId: this.context.estudioId,
      userId: this.context.userId,
    };
  }
}

function signToken(jwtService: JwtService, payload: Record<string, unknown>): string {
  return jwtService.sign(payload, { secret: TEST_JWT_SECRET });
}

describe('Tenant Context Boundary (integration)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let server: http.Server;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RequestContextModule],
      controllers: [TestController],
      providers: [
        JwtService,
        {
          provide: ConfigService,
          useValue: { get: (key: string) => (key === 'JWT_SECRET' ? TEST_JWT_SECRET : undefined) },
        },
        Reflector,
        JwtAuthGuard,
        EstudioMemberGuard,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    jwtService = moduleRef.get(JwtService);
    server = app.getHttpServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
  });

  afterAll(async () => {
    await app.close();
  });

  function request(method: 'GET', path: string) {
    return new RequestHelper(server, method, path);
  }

  describe('public route — middleware sets context without guard enforcement', () => {
    it('should set estudioId in both decorator and service when header is present', async () => {
      const res = await request('GET', '/test/public')
        .header(ESTUDIO_ID_HEADER, 'estudio-abc')
        .send();

      expect(res.status).toBe(200);
      expect(res.body.estudioId).toBe('estudio-abc');
      expect(res.body.contextEstudioId).toBe('estudio-abc');
    });

    it('should leave estudioId undefined when header is absent', async () => {
      const res = await request('GET', '/test/public').send();

      expect(res.status).toBe(200);
      expect(res.body.estudioId).toBeUndefined();
      expect(res.body.contextEstudioId).toBeUndefined();
    });

    it('should generate a correlationId when header is absent', async () => {
      const res = await request('GET', '/test/public').send();

      expect(res.status).toBe(200);
      expect(res.body.correlationId).toBeDefined();
      expect(typeof res.body.correlationId).toBe('string');
      expect(res.body.correlationId.length).toBeGreaterThan(0);
    });

    it('should use provided correlationId header', async () => {
      const res = await request('GET', '/test/public')
        .header(CORRELATION_ID_HEADER, 'custom-corr-id')
        .send();

      expect(res.status).toBe(200);
      expect(res.body.correlationId).toBe('custom-corr-id');
    });
  });

  describe('auth-only route — JwtAuthGuard without tenant requirement', () => {
    it('should reject unauthenticated requests (401)', async () => {
      const res = await request('GET', '/test/auth-only').send();
      expect(res.status).toBe(401);
    });

    it('should allow authenticated requests without estudioId header', async () => {
      const token = signToken(jwtService, { sub: 'user-1', email: 'u@test.com', rol: 'SOCIO' });

      const res = await request('GET', '/test/auth-only')
        .header('Authorization', `Bearer ${token}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.estudioId).toBeUndefined();
    });

    it('should propagate estudioId when header is present alongside valid token', async () => {
      const token = signToken(jwtService, { sub: 'user-1', email: 'u@test.com', rol: 'SOCIO' });

      const res = await request('GET', '/test/auth-only')
        .header('Authorization', `Bearer ${token}`)
        .header(ESTUDIO_ID_HEADER, 'estudio-xyz')
        .send();

      expect(res.status).toBe(200);
      expect(res.body.estudioId).toBe('estudio-xyz');
      expect(res.body.contextEstudioId).toBe('estudio-xyz');
    });

    it('should not set userId in context — middleware runs before JWT guard sets req.user', async () => {
      const token = signToken(jwtService, { sub: 'user-42', id: 'user-42', email: 'u@test.com', rol: 'SOCIO' });

      const res = await request('GET', '/test/auth-only')
        .header('Authorization', `Bearer ${token}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.userId).toBeUndefined();
    });
  });

  describe('tenant-required route — EstudioMemberGuard (JWT + tenant)', () => {
    it('should reject unauthenticated requests (401)', async () => {
      const res = await request('GET', '/test/tenant-required')
        .header(ESTUDIO_ID_HEADER, 'estudio-abc')
        .send();

      expect(res.status).toBe(401);
    });

    it('should reject authenticated requests without estudioId header (400)', async () => {
      const token = signToken(jwtService, { sub: 'user-1', email: 'u@test.com', rol: 'SOCIO' });

      const res = await request('GET', '/test/tenant-required')
        .header('Authorization', `Bearer ${token}`)
        .send();

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('x-estudio-id');
    });

    it('should reject authenticated requests with empty estudioId header (400)', async () => {
      const token = signToken(jwtService, { sub: 'user-1', email: 'u@test.com', rol: 'SOCIO' });

      const res = await request('GET', '/test/tenant-required')
        .header('Authorization', `Bearer ${token}`)
        .header(ESTUDIO_ID_HEADER, '')
        .send();

      expect(res.status).toBe(400);
    });

    it('should allow authenticated requests with valid estudioId header', async () => {
      const token = signToken(jwtService, { sub: 'user-1', email: 'u@test.com', rol: 'SOCIO' });

      const res = await request('GET', '/test/tenant-required')
        .header('Authorization', `Bearer ${token}`)
        .header(ESTUDIO_ID_HEADER, 'estudio-123')
        .send();

      expect(res.status).toBe(200);
      expect(res.body.estudioId).toBe('estudio-123');
      expect(res.body.contextEstudioId).toBe('estudio-123');
    });

    it('should not have userId in context — middleware runs before guard populates req.user', async () => {
      const token = signToken(jwtService, { sub: 'user-99', id: 'user-99', email: 'u@test.com', rol: 'SOCIO' });

      const res = await request('GET', '/test/tenant-required')
        .header('Authorization', `Bearer ${token}`)
        .header(ESTUDIO_ID_HEADER, 'estudio-123')
        .send();

      expect(res.status).toBe(200);
      expect(res.body.userId).toBeUndefined();
    });
  });
});

class RequestHelper {
  private headers: Record<string, string> = {};

  constructor(
    private readonly server: http.Server,
    private readonly method: string,
    private readonly path: string,
  ) {}

  header(key: string, value: string): this {
    this.headers[key] = value;
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
      req.end();
    });
  }
}
