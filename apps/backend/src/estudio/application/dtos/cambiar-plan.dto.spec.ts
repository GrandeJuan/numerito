import { BadRequestException } from '@nestjs/common';
import { cambiarPlanSchema } from '@numerito/shared';
import { cambiarPlanDtoSchema } from './cambiar-plan.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('CambiarPlanDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(cambiarPlanDtoSchema);

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(cambiarPlanDtoSchema).toBe(cambiarPlanSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes with valid planId', () => {
      const result = pipe.transform({ planId: 'plan-premium' });
      expect(result).toEqual({ planId: 'plan-premium' });
    });
  });

  describe('rejects invalid input', () => {
    it('rejects empty planId', () => {
      expect(() => pipe.transform({ planId: '' })).toThrow(BadRequestException);
    });

    it('rejects missing planId', () => {
      expect(() => pipe.transform({})).toThrow(BadRequestException);
    });
  });

  describe('strips unknown fields', () => {
    it('removes fields not in the schema', () => {
      const result = pipe.transform({ planId: 'plan-premium', unknown: 'field' });
      expect(result).not.toHaveProperty('unknown');
    });
  });
});
