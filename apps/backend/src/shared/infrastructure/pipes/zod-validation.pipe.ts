import { type PipeTransform, BadRequestException } from '@nestjs/common';
import type { ZodSchema, z } from 'zod';

export class ZodValidationPipe<S extends ZodSchema = ZodSchema> implements PipeTransform {
  constructor(private readonly schema: S) {}

  transform(value: unknown): z.infer<S> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      throw new BadRequestException({ message: 'Error de validación', errors });
    }
    return result.data;
  }
}
